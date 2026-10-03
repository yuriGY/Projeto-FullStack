import { createContext, useContext } from 'react'

/**
 * Estado e dispatch viajam em contextos separados de propósito: componentes que
 * só disparam ações (formulário, botões) não re-renderizam quando o histórico
 * muda, porque não assinam o contexto de estado.
 */
export const ValidationStateContext = createContext(null)
export const ValidationDispatchContext = createContext(null)

export function useValidationState() {
  const context = useContext(ValidationStateContext)
  if (context === null) {
    throw new Error('useValidationState precisa ser usado dentro de <ValidationProvider>.')
  }
  return context
}

export function useValidationDispatch() {
  const context = useContext(ValidationDispatchContext)
  if (context === null) {
    throw new Error('useValidationDispatch precisa ser usado dentro de <ValidationProvider>.')
  }
  return context
}
