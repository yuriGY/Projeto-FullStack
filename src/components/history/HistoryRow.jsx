import { memo } from 'react'
import { Chip, IconButton, Stack, TableCell, TableRow, Tooltip, Typography } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import RefreshIcon from '@mui/icons-material/Refresh'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'

import { flagEmoji } from '../../services/countries'
import { lineTypeLabel } from '../../services/lineTypes'

function formatarData(timestamp) {
  if (!timestamp) return '—'
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusChip({ entry }) {
  if (entry.status === 'loading' || entry.status === 'idle') {
    return <Chip size="small" variant="outlined" icon={<CircularProgress size={12} />} label="Consultando" />
  }
  if (entry.status === 'error') {
    return (
      <Tooltip title={entry.error?.info ?? ''}>
        <Chip size="small" color="warning" variant="outlined" label="Falhou" />
      </Tooltip>
    )
  }
  return entry.result?.valid ? (
    <Chip size="small" color="success" label="Válido" />
  ) : (
    <Chip size="small" color="error" variant="outlined" label="Inválido" />
  )
}

/**
 * Linha do histórico.
 *
 * Envolvida em `memo` porque o reducer só troca a referência do registro que
 * mudou: ao validar um número novo, ou ao revalidar um existente, as outras
 * linhas recebem exatamente o mesmo objeto e param de re-renderizar. Para isso
 * funcionar, `onRevalidate` e `onRemove` precisam ter identidade estável, por
 * isso recebem o id como argumento em vez de virem como closure por linha.
 */
const HistoryRow = memo(function HistoryRow({ entry, onSelect, onRevalidate, onRemove }) {
  const { result } = entry
  const ocupada = entry.status === 'loading' || entry.status === 'idle'

  return (
    <TableRow
      hover
      onClick={() => onSelect(entry.id)}
      sx={{ cursor: 'pointer' }}
      aria-label={`Ver detalhes de ${result?.international_format || entry.raw}`}
    >
      <TableCell>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {result?.international_format || entry.raw}
        </Typography>
        {entry.source === 'cache' ? (
          <Typography variant="caption" color="text.secondary">
            em cache
          </Typography>
        ) : null}
      </TableCell>

      <TableCell>
        <StatusChip entry={entry} />
      </TableCell>

      <TableCell>
        {result?.country_name ? `${flagEmoji(result.country_code)} ${result.country_name}` : '—'}
      </TableCell>

      <TableCell>{result?.carrier || '—'}</TableCell>

      <TableCell>{lineTypeLabel(result?.line_type) || '—'}</TableCell>

      <TableCell>
        <Typography variant="caption" color="text.secondary">
          {formatarData(entry.createdAt)}
        </Typography>
      </TableCell>

      <TableCell align="right" onClick={(event) => event.stopPropagation()}>
        <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
          <Tooltip title="Revalidar (ignora o cache e gasta 1 consulta)">
            <IconButton size="small" disabled={ocupada} onClick={() => onRevalidate(entry.id)}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remover do histórico">
            <IconButton size="small" disabled={ocupada} onClick={() => onRemove(entry.id)}>
              <DeleteOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  )
})

export default HistoryRow
