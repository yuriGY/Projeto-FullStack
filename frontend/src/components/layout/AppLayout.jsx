import { AppBar, Box, Chip, Container, Stack, Toolbar, Tooltip, Typography } from '@mui/material'
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone'

import { useValidationState } from '../../state/validationContexts'
import { selectQuotaRemaining } from '../../state/validationReducer'

/** Alerta visualmente quando o saldo da cota mensal está acabando. */
function quotaColor(restante, limite) {
  if (restante === 0) return 'error'
  if (restante <= Math.max(5, limite * 0.1)) return 'warning'
  return 'default'
}

export default function AppLayout({ children }) {
  const state = useValidationState()
  const restante = selectQuotaRemaining(state)
  const cor = quotaColor(restante, state.quota.limit)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <PhoneIphoneIcon />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" component="h1" sx={{ lineHeight: 1.2 }}>
              ValidaFone
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              Central de Validação de Contatos
            </Typography>
          </Box>

          <Tooltip
            title={`${state.quota.used} de ${state.quota.limit} consultas usadas neste mês. Resultados em cache não consomem cota.`}
          >
            <Chip
              size="small"
              color={cor}
              label={`${restante}/${state.quota.limit} restantes`}
              sx={
                cor === 'default'
                  ? { bgcolor: 'rgba(255,255,255,0.18)', color: 'inherit', whiteSpace: 'nowrap' }
                  : { whiteSpace: 'nowrap' }
              }
            />
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>{children}</Stack>
      </Container>
    </Box>
  )
}
