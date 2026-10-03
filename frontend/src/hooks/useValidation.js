import { useCallback, useEffect, useRef } from 'react'

import { NumverifyError, validatePhone } from '../services/numverifyClient'
import { buildQuery, cacheKey } from '../services/normalizePhone'
import { ACTIONS } from '../state/validationReducer'
import { useValidationDispatch, useValidationState } from '../state/validationContexts'

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

/**
 * Orquestra as consultas: cria os registros, resolve pelo cache quando possível
 * e traduz o desfecho em ações do reducer.
 */
export function useValidation() {
  const state = useValidationState()
  const dispatch = useValidationDispatch()

  /** Requisição em voo, para ser cancelada quando outra começa. */
  const controllerRef = useRef(null)
  /**
   * Cada consulta recebe um número sequencial. Se uma resposta lenta chegar
   * depois que outra consulta já foi disparada, ela é descartada — senão o
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

  const runRequest = useCallback(
    async ({ id, raw, countryCode, allowCache = true }) => {
      const query = buildQuery(raw, countryCode)
      const chave = cacheKey(raw, countryCode)

      if (allowCache && chave) {
        const emCache = stateRef.current.cache?.[chave]
        if (emCache) {
          dispatch({ type: ACTIONS.REQUEST_CACHED, payload: { id, result: emCache } })
          return
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

        if (requestId !== requestIdRef.current) return
        dispatch({
          type: ACTIONS.REQUEST_SUCCESS,
          payload: { id, result, source: SOURCE_API, cacheKey: chave },
        })
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
          return
        }

        if (error?.name === 'TimeoutError') {
          dispatch({
            type: ACTIONS.REQUEST_ERROR,
            payload: {
              id,
              source: SOURCE_API,
              error: { code: null, type: 'timeout', info: 'A API demorou demais para responder.' },
            },
          })
          return
        }

        if (requestId !== requestIdRef.current) return
        dispatch({
          type: ACTIONS.REQUEST_ERROR,
          payload: { id, source: SOURCE_API, error: toErrorPayload(error) },
        })
      }
    },
    [dispatch],
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

      for (let indice = 0; indice < entries.length; indice += 1) {
        await runRequest({
          id: entries[indice].id,
          raw: items[indice].raw,
          countryCode: items[indice].countryCode,
        })
      }
    },
    [dispatch, runRequest],
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
