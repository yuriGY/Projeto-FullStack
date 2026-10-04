import { useCallback } from 'react'

import { ACTIONS } from '../state/validationReducer'
import { useValidationDispatch } from '../state/validationContexts'

export function createToastId() {
  return globalThis.crypto?.randomUUID?.() ?? `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/** Devolve uma função estável para empilhar notificações no ToastHost. */
export function useToast() {
  const dispatch = useValidationDispatch()

  return useCallback(
    (severity, message) => {
      dispatch({ type: ACTIONS.PUSH_TOAST, payload: { id: createToastId(), severity, message } })
    },
    [dispatch],
  )
}
