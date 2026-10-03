import { Box, Button, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'

import { flagEmoji } from '../../services/countries'
import { lineTypeLabel } from '../../services/lineTypes'

const VALIDADES = [
  { value: 'all', label: 'Todas as situações' },
  { value: 'valid', label: 'Apenas válidos' },
  { value: 'invalid', label: 'Apenas inválidos' },
  { value: 'error', label: 'Apenas falhas' },
]

export default function FilterBar({ filters, options, onChange, onClear, total, visible }) {
  const seletorSx = { minWidth: { xs: '100%', sm: 170 }, flex: '1 1 170px' }

  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label="Buscar"
          placeholder="Número, operadora, país…"
          value={filters.text}
          onChange={(event) => onChange('text', event.target.value)}
          sx={{ flex: '2 1 240px' }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          select
          size="small"
          label="Situação"
          value={filters.validity}
          onChange={(event) => onChange('validity', event.target.value)}
          sx={seletorSx}
        >
          {VALIDADES.map((item) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
        <TextField
          select
          size="small"
          label="País"
          value={filters.country}
          onChange={(event) => onChange('country', event.target.value)}
          sx={seletorSx}
        >
          <MenuItem value="all">Todos os países</MenuItem>
          {options.countries.map((item) => (
            <MenuItem key={item.code} value={item.code}>
              {flagEmoji(item.code)} {item.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Operadora"
          value={filters.carrier}
          onChange={(event) => onChange('carrier', event.target.value)}
          sx={seletorSx}
        >
          <MenuItem value="all">Todas as operadoras</MenuItem>
          {options.carriers.map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Tipo de linha"
          value={filters.lineType}
          onChange={(event) => onChange('lineType', event.target.value)}
          sx={seletorSx}
        >
          <MenuItem value="all">Todos os tipos</MenuItem>
          {options.lineTypes.map((item) => (
            <MenuItem key={item} value={item}>
              {lineTypeLabel(item)}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {visible === total
            ? `${total} ${total === 1 ? 'registro' : 'registros'}`
            : `${visible} de ${total} registros`}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          size="small"
          color="inherit"
          startIcon={<DeleteSweepIcon />}
          disabled={total === 0}
          onClick={onClear}
        >
          Limpar histórico
        </Button>
      </Stack>
    </Stack>
  )
}
