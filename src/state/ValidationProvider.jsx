import { useEffect, useReducer } from 'react'

import { createInitialState, initialState, validationReducer } from './validationReducer'
import { loadState, saveState } from './persistence'
import { ValidationDispatchContext, ValidationStateContext } from './validationContexts'

export function ValidationProvider({ children }) {
  const [state, dispatch] = useReducer(validationReducer, initialState, () => createInitialState(loadState()))

  useEffect(() => {
    saveState(state)
  }, [state])

  return (
    <ValidationStateContext.Provider value={state}>
      <ValidationDispatchContext.Provider value={dispatch}>{children}</ValidationDispatchContext.Provider>
    </ValidationStateContext.Provider>
  )
}
