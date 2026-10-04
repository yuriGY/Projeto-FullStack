import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Alert, Box, Stack } from '@mui/material'

import { useValidationDispatch, useValidationState } from '../../state/validationContexts'
import { ACTIONS } from '../../state/validationReducer'

const DURACAO_MS = 5000

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), DURACAO_MS)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <Alert severity={toast.severity} variant="filled" onClose={() => onDismiss(toast.id)} sx={{ boxShadow: 3 }}>
      {toast.message}
    </Alert>
  )
}

/**
 * Notificações globais.
 *
 * Também vai para `#portal-root` via `createPortal`: a pilha é posicionada em
 * relação à janela, e renderizá-la dentro do container da aplicação a deixaria
 * sujeita ao `overflow` e ao z-index dos ancestrais.
 */
export default function ToastHost() {
  const { toasts } = useValidationState()
  const dispatch = useValidationDispatch()

  const dispensar = (id) => dispatch({ type: ACTIONS.DISMISS_TOAST, payload: { id } })

  const alvo = typeof document === 'undefined' ? null : document.getElementById('portal-root')
  if (!alvo || toasts.length === 0) return null

  return createPortal(
    <Box
      sx={{
        position: 'fixed',
        zIndex: 1400,
        bottom: 16,
        left: 16,
        right: { xs: 16, sm: 'auto' },
        maxWidth: { sm: 420 },
      }}
    >
      <Stack spacing={1}>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dispensar} />
        ))}
      </Stack>
    </Box>,
    alvo,
  )
}
