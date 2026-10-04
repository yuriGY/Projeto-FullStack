import { useCallback, useEffect, useRef } from 'react'

import { NumverifyError, validatePhone } from '../services/numverifyClient'
import { buildQuery, cacheKey } from '../services/normalizePhone'
import { ACTIONS } from '../state/validationReducer'
import { useValidationDispatch, useValidationState } from '../state/validationContexts'
import { useToast } from './useToast'

const SOURCE_API = 'api'

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createEntry(raw, countryCode) {
  const agora = Date.now()
  return {
    id: createId(),
    raw: String(raw).trim(),
    countryCode,
    status: 'idle',
    result: null,
    error: null,
    source: SOURCE_API,
    createdAt: agora,
    updatedAt: agora,
  }
}

function toErrorPayload(error) {
  if (error instanceof NumverifyError) {
    return { code: error.code, type: error.type, info: error.info }
  }
  return {
    code: null,
    type: 'unexpected_error',
    info: error?.message ?? 'Erro inesperado ao validar o número.',
  }
}

function resumoDoLote({ validos, invalidos, falhas, doCache }) {
  const partes = [`${validos} ${validos === 1 ? 'válido' : 'válidos'}`]
  if (invalidos > 0) partes.push(`${invalidos} ${invalidos === 1 ? 'inválido' : 'inválidos'}`)
  if (falhas > 0) partes.push(`${falhas} ${falhas === 1 ? 'falha' : 'falhas'}`)
  const base = `Lote concluído: ${partes.join(', ')}`
  return doCache > 0 ? `${base} · ${doCache} resolvido(s) pelo cache` : base
}

/**
 * Orquestra as consultas: cria os registros, resolve pelo cache quando possível
 * e traduz o desfecho em ações do reducer.
 */
export function useValidation() {
  const state = useValidationState()
  const dispatch = useValidationDispatch()
  const toast = useToast()

  /** Requisição em voo, para ser cancelada quando outra começa. */
  const controllerRef = useRef(null)
  /**
   * Cada consulta recebe um número sequencial. Se uma resposta lenta chegar
   * depois que outra consulta já foi disparada, ela é descartada, senão o
   * resultado antigo sobrescreveria o mais recente.
   */
  const requestIdRef = useRef(0)
  /**
   * Espelho do estado, lido apenas dentro das callbacks assíncronas. Permite
   * consultar o cache sem colocar `state` nas dependências, o que manteria
   * `validate` e `revalidate` trocando de identidade a cada render e anularia
   * o efeito do `memo` nas linhas do histórico.
   */
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => () => controllerRef.current?.abort(), [])

  /**
   * Executa uma consulta para um registro que já existe no histórico.
   *
   * @param {{ id: string, raw: string, countryCode: string, allowCache?: boolean, notify?: boolean }} params
   *   `notify` fica desligado no lote, que emite um único resumo no fim em vez
   *   de uma notificação por item.
   * @returns {Promise<{ status: 'success'|'error', valid?: boolean, source?: string }>}
   */
  const runRequest = useCallback(
    async ({ id, raw, countryCode, allowCache = true, notify = true }) => {
      const query = buildQuery(raw, countryCode)
      const chave = cacheKey(raw, countryCode)

      if (allowCache && chave) {
        const emCache = stateRef.current.cache?.[chave]
        if (emCache) {
          dispatch({ type: ACTIONS.REQUEST_CACHED, payload: { id, result: emCache } })
          return { status: 'success', valid: Boolean(emCache.valid), source: 'cache' }
        }
      }

      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId

      dispatch({ type: ACTIONS.REQUEST_START, payload: { id } })

      try {
        const result = await validatePhone({
          number: query.number,
          countryCode: query.countryCode,
          signal: controller.signal,
        })

        if (requestId !== requestIdRef.current) return { status: 'error' }
        dispatch({
          type: ACTIONS.REQUEST_SUCCESS,
          payload: { id, result, source: SOURCE_API, cacheKey: chave },
        })
        return { status: 'success', valid: Boolean(result.valid), source: SOURCE_API }
      } catch (error) {
        if (error?.name === 'AbortError') {
          dispatch({
            type: ACTIONS.REQUEST_ERROR,
            payload: {
              id,
              source: SOURCE_API,
              error: { code: null, type: 'aborted', info: 'Consulta cancelada por uma nova busca.' },
            },
          })
          return { status: 'error' }
        }

        const payload =
          error?.name === 'TimeoutError'
            ? { code: null, type: 'timeout', info: 'A API demorou demais para responder.' }
            : toErrorPayload(error)

        if (error?.name !== 'TimeoutError' && requestId !== requestIdRef.current) {
          return { status: 'error' }
        }

        dispatch({ type: ACTIONS.REQUEST_ERROR, payload: { id, source: SOURCE_API, error: payload } })
        if (notify) toast('error', payload.info)
        return { status: 'error' }
      }
    },
    [dispatch, toast],
  )

  const validate = useCallback(
    async (raw, countryCode) => {
      const entry = createEntry(raw, buildQuery(raw, countryCode).countryCode)
      dispatch({ type: ACTIONS.ADD_ENTRY, payload: entry })
      await runRequest({ id: entry.id, raw, countryCode })
    },
    [dispatch, runRequest],
  )

  const validateBatch = useCallback(
    async (items) => {
      const entries = items.map((item) => createEntry(item.raw, buildQuery(item.raw, item.countryCode).countryCode))
      if (entries.length === 0) return

      dispatch({ type: ACTIONS.ADD_BATCH, payload: { entries } })

      const tally = { validos: 0, invalidos: 0, falhas: 0, doCache: 0 }

      for (let indice = 0; indice < entries.length; indice += 1) {
        const outcome = await runRequest({
          id: entries[indice].id,
          raw: items[indice].raw,
          countryCode: items[indice].countryCode,
          notify: false,
        })

        if (outcome.status === 'error') {
          tally.falhas += 1
        } else {
          if (outcome.valid) tally.validos += 1
          else tally.invalidos += 1
          if (outcome.source === 'cache') tally.doCache += 1
        }
      }

      toast(tally.falhas > 0 ? 'warning' : 'success', resumoDoLote(tally))
    },
    [dispatch, runRequest, toast],
  )

  const revalidate = useCallback(
    async (id) => {
      const entry = stateRef.current.entries.find((item) => item.id === id)
      if (!entry) return
      await runRequest({ id, raw: entry.raw, countryCode: entry.countryCode, allowCache: false })
    },
    [runRequest],
  )

  return { validate, validateBatch, revalidate }
}
