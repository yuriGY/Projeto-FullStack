import { Alert, AlertTitle, Box, Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'

import { flagEmoji } from '../../services/countries'
import { useValidationState } from '../../state/validationContexts'
import { selectLastEntry } from '../../state/validationReducer'

const LINE_TYPE_LABELS = {
  mobile: 'Celular',
  landline: 'Fixo',
  voip: 'VoIP',
  special_services: 'Serviço especial',
  toll_free: 'Discagem gratuita',
  premium_rate: 'Tarifa premium',
}

const SOURCE_LABELS = {
  api: 'Consulta à API',
  cache: 'Resultado em cache',
}

function Field({ label, value }) {
  return (
    <Box sx={{ minWidth: 180, flex: '1 1 180px' }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
        {value || '—'}
      </Typography>
    </Box>
  )
}

export default function ResultCard() {
  const state = useValidationState()
  const entry = selectLastEntry(state)

  if (!entry) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Nenhuma consulta ainda. Informe um número acima para começar.
        </Typography>
      </Paper>
    )
  }

  if (entry.status === 'loading' || entry.status === 'idle') {
    return (
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={24} />
          <Typography color="text.secondary">Consultando {entry.raw}…</Typography>
        </Stack>
      </Paper>
    )
  }

  if (entry.status === 'error') {
    return (
      <Alert severity="error" variant="outlined">
        <AlertTitle>Não foi possível validar {entry.raw}</AlertTitle>
        {entry.error?.info}
        {entry.error?.code ? (
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            Código {entry.error.code} · {entry.error.type}
          </Typography>
        ) : null}
      </Alert>
    )
  }

  const { result } = entry

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        {result.valid ? (
          <Chip icon={<CheckCircleIcon />} color="success" label="Número válido" />
        ) : (
          <Chip icon={<CancelIcon />} color="error" label="Número inválido" />
        )}
        <Chip size="small" variant="outlined" label={SOURCE_LABELS[entry.source] ?? entry.source} />
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="h6" component="p" sx={{ fontFamily: 'monospace' }}>
          {result.international_format || entry.raw}
        </Typography>
      </Stack>

      {result.valid ? (
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 3 }}>
          <Field label="Formato local" value={result.local_format} />
          <Field
            label="País"
            value={
              result.country_name
                ? `${flagEmoji(result.country_code)} ${result.country_name} (${result.country_prefix})`
                : ''
            }
          />
          <Field label="Localidade" value={result.location} />
          <Field label="Operadora" value={result.carrier} />
          <Field label="Tipo de linha" value={LINE_TYPE_LABELS[result.line_type] ?? result.line_type} />
        </Stack>
      ) : (
        <Typography color="text.secondary">
          A API não reconheceu esse número. Confira os dígitos e o país selecionado.
        </Typography>
      )}
    </Paper>
  )
}
