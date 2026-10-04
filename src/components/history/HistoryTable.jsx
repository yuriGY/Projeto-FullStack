import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material'

import HistoryRow from './HistoryRow'

const COLUNAS = [
  { id: 'raw', label: 'Número', sortable: true },
  { id: 'validity', label: 'Situação', sortable: true },
  { id: 'country', label: 'País', sortable: true },
  { id: 'carrier', label: 'Operadora', sortable: true },
  { id: 'lineType', label: 'Tipo de linha', sortable: true },
  { id: 'createdAt', label: 'Consultado em', sortable: true },
  { id: 'actions', label: '', sortable: false, align: 'right' },
]

export default function HistoryTable({ entries, sort, onSort, onSelect, onRevalidate, onRemove, hasEntries }) {
  if (entries.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        {hasEntries
          ? 'Nenhum registro corresponde aos filtros aplicados.'
          : 'O histórico está vazio. Valide um número para começar.'}
      </Typography>
    )
  }

  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {COLUNAS.map((coluna) => (
              <TableCell key={coluna.id} align={coluna.align} sx={{ whiteSpace: 'nowrap' }}>
                {coluna.sortable ? (
                  <TableSortLabel
                    active={sort.field === coluna.id}
                    direction={sort.field === coluna.id ? sort.direction : 'desc'}
                    onClick={() => onSort(coluna.id)}
                  >
                    {coluna.label}
                  </TableSortLabel>
                ) : (
                  coluna.label
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {entries.map((entry) => (
            <HistoryRow
              key={entry.id}
              entry={entry}
              onSelect={onSelect}
              onRevalidate={onRevalidate}
              onRemove={onRemove}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
