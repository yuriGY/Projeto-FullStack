import { useRef, useState } from 'react'
import { Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'

import PhoneInput from './PhoneInput'
import BatchDialog from './BatchDialog'
import { COUNTRIES, findCountry, flagEmoji } from '../../services/countries'
import { isInternational, validateInput } from '../../services/normalizePhone'
import { useValidation } from '../../hooks/useValidation'
import { useValidationState } from '../../state/validationContexts'
import { selectLastEntry } from '../../state/validationReducer'

export default function ValidationForm() {
  const { validate } = useValidation()
  const state = useValidationState()
  const isLoading = selectLastEntry(state)?.status === 'loading'

  const [number, setNumber] = useState('')
  const [country, setCountry] = useState('BR')
  const [localError, setLocalError] = useState('')
  const [batchOpen, setBatchOpen] = useState(false)

  const inputRef = useRef(null)
  const international = isInternational(number)
  const dialPrefix = international ? '' : (findCountry(country)?.dial ?? '')

  function handleSubmit(event) {
    event.preventDefault()

    const check = validateInput(number, country)
    if (!check.ok) {
      setLocalError(check.message)
      inputRef.current?.focus()
      return
    }

    setLocalError('')
    validate(number, country)
    setNumber('')
    inputRef.current?.focus()
  }

  return (
    <Paper component="form" onSubmit={handleSubmit} variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" component="h2">
          Validar número
        </Typography>
        <Button
          type="button"
          size="small"
          startIcon={<PlaylistAddIcon />}
          onClick={() => setBatchOpen(true)}
        >
          Validar em lote
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
        <TextField
          select
          label="País"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          disabled={international || isLoading}
          helperText={international ? 'Ignorado em formato internacional' : ' '}
          sx={{ minWidth: { xs: '100%', sm: 220 } }}
        >
          {COUNTRIES.map((item) => (
            <MenuItem key={item.code} value={item.code}>
              {flagEmoji(item.code)} {item.name} ({item.dial})
            </MenuItem>
          ))}
        </TextField>

        <PhoneInput
          ref={inputRef}
          value={number}
          onChange={(next) => {
            setNumber(next)
            if (localError) setLocalError('')
          }}
          error={Boolean(localError)}
          helperText={localError || 'Formato local ou internacional iniciando com "+"'}
          disabled={isLoading}
          prefix={dialPrefix}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          startIcon={<SearchIcon />}
          disabled={isLoading}
          sx={{ height: 56, px: 4, width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}
        >
          Validar
        </Button>
      </Stack>

      <BatchDialog open={batchOpen} onClose={() => setBatchOpen(false)} />
    </Paper>
  )
}
