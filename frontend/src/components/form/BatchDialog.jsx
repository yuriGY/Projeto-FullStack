import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { COUNTRIES, flagEmoji } from '../../services/countries'
import { cacheKey, validateInput } from '../../services/normalizePhone'
import { useValidation } from '../../hooks/useValidation'
import { useValidationState } from '../../state/validationContexts'
import { selectBatchProgress, selectQuotaRemaining } from '../../state/validationReducer'

export default function BatchDialog({ open, onClose }) {
  const { validateBatch } = useValidation()
  const state = useValidationState()

  const [text, setText] = useState('')
  const [country, setCountry] = useState('BR')

  const progresso = selectBatchProgress(state)
  const rodando = progresso !== null
  const restante = selectQuotaRemaining(state)

  /**
   * Separa a lista colada em aceitos, rejeitados e duplicados, e calcula quantas
   * requisições o lote realmente vai gastar, já que números em cache saem de graça.
   */
  const analise = useMemo(() => {
    const tokens = text
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean)

    const vistos = new Set()
    const aceitos = []
    const rejeitados = []
    let duplicados = 0

    for (const token of tokens) {
      const check = validateInput(token, country)
      if (!check.ok) {
        rejeitados.push(token)
        continue
      }
      const chave = cacheKey(token, country)
      if (vistos.has(chave)) {
        duplicados += 1
        continue
      }
      vistos.add(chave)
      aceitos.push(token)
    }

    const custo = aceitos.filter((token) => !state.cache?.[cacheKey(token, country)]).length

    return { aceitos, rejeitados, duplicados, custo }
  }, [text, country, state.cache])

  const excedeCota = analise.custo > restante

  async function handleSubmit() {
    await validateBatch(analise.aceitos.map((raw) => ({ raw, countryCode: country })))
    setText('')
  }

  return (
    <Dialog
      open={open}
      onClose={rodando ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      disableEscapeKeyDown={rodando}
    >
      <DialogTitle>Validar em lote</DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Cole uma lista de números, um por linha (vírgula e ponto e vírgula também funcionam).
          </Typography>

          <TextField
            select
            label="País"
            size="small"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            disabled={rodando}
            sx={{ maxWidth: 260 }}
          >
            {COUNTRIES.map((item) => (
              <MenuItem key={item.code} value={item.code}>
                {flagEmoji(item.code)} {item.name} ({item.dial})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Números"
            multiline
            minRows={6}
            maxRows={12}
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={rodando}
            placeholder={'11987654321\n21988887777\n+5531999998888'}
            sx={{ '& textarea': { fontFamily: 'monospace' } }}
          />

          {analise.aceitos.length > 0 ? (
            <Alert severity={excedeCota ? 'error' : 'info'} variant="outlined">
              <Typography variant="body2">
                {analise.aceitos.length} {analise.aceitos.length === 1 ? 'número' : 'números'} a validar
                {analise.duplicados > 0 ? ` · ${analise.duplicados} duplicado(s) ignorado(s)` : ''}
                {analise.rejeitados.length > 0 ? ` · ${analise.rejeitados.length} inválido(s) descartado(s)` : ''}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Custo: <strong>{analise.custo}</strong> de {restante} consultas restantes
                {analise.custo < analise.aceitos.length
                  ? ` (${analise.aceitos.length - analise.custo} já em cache)`
                  : ''}
              </Typography>
              {excedeCota ? (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  O lote excede a cota disponível. Reduza a lista antes de continuar.
                </Typography>
              ) : null}
            </Alert>
          ) : null}

          {rodando ? (
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Processando {progresso.done} de {progresso.total}…
              </Typography>
              <LinearProgress variant="determinate" value={(progresso.done / progresso.total) * 100} />
            </Stack>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={rodando} color="inherit">
          Fechar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={rodando || analise.aceitos.length === 0 || excedeCota}
        >
          Validar {analise.aceitos.length > 0 ? analise.aceitos.length : ''}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
