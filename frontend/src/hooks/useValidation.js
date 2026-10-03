import { useCallback, useEffect, useRef } from 'react'

import { NumverifyError, validatePhone } from '../services/numverifyClient'
import { buildQuery } from '../services/normalizePhone'
import { ACTIONS } from '../state/validationReducer'
import { useValidationDispatch } from '../state/validationContexts'

const SOURCE_API = 'api'

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`
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
 * Orquestra uma consulta: cria o registro, dispara a chamada e traduz o
 * desfecho em ações do reducer.
 */
export function useValidation() {
  const dispatch = useValidationDispatch()

  /** Requisição em voo, para ser cancelada quando outra começa. */
  const controllerRef = useRef(null)
  /**
   * Cada consulta recebe um número sequencial. Se uma resposta lenta chegar
   * depois que outra consulta já foi disparada, ela é descartada — senão o
   * resultado antigo sobrescreveria o mais recente.
   */
  const requestIdRef = useRef(0)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const validate = useCallback(
    async (raw, countryCode) => {
      const query = buildQuery(raw, countryCode)
      const id = createId()

      dispatch({
        type: ACTIONS.ADD_ENTRY,
        payload: {
          id,
          raw: String(raw).trim(),
          countryCode: query.countryCode,
          status: 'idle',
          result: null,
          error: null,
          source: SOURCE_API,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      })

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

        if (requestId !== requestIdRef.current) return // resposta obsoleta
        dispatch({ type: ACTIONS.REQUEST_SUCCESS, payload: { id, result, source: SOURCE_API } })
      } catch (error) {
        // O cancelamento marca o próprio registro que foi interrompido, mesmo
        // sendo obsoleto — caso contrário ele ficaria preso em "carregando".
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

  return { validate }
}
