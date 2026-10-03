import { useCallback, useMemo } from 'react'
import { LinearProgress, Paper, Stack, Typography } from '@mui/material'

import FilterBar from './FilterBar'
import HistoryTable from './HistoryTable'
import { useValidation } from '../../hooks/useValidation'
import { useValidationDispatch, useValidationState } from '../../state/validationContexts'
import {
  ACTIONS,
  collectFilterOptions,
  filterEntries,
  selectBatchProgress,
  sortEntries,
} from '../../state/validationReducer'

/**
 * Container do histórico: concentra as derivações do estado e distribui os
 * dados já prontos para a barra de filtros e para a tabela.
 */
export default function HistoryPanel() {
  const state = useValidationState()
  const dispatch = useValidationDispatch()
  const { revalidate } = useValidation()

  const options = useMemo(() => collectFilterOptions(state.entries), [state.entries])

  const visible = useMemo(
    () => sortEntries(filterEntries(state.entries, state.filters), state.sort),
    [state.entries, state.filters, state.sort],
  )

  const progresso = selectBatchProgress(state)

  const handleFilter = useCallback(
    (key, value) => dispatch({ type: ACTIONS.SET_FILTER, payload: { key, value } }),
    [dispatch],
  )
  const handleSort = useCallback(
    (field) => dispatch({ type: ACTIONS.SET_SORT, payload: { field } }),
    [dispatch],
  )
  const handleRemove = useCallback(
    (id) => dispatch({ type: ACTIONS.REMOVE_ENTRY, payload: { id } }),
    [dispatch],
  )
  const handleClear = useCallback(() => dispatch({ type: ACTIONS.CLEAR_HISTORY }), [dispatch])
  const handleRevalidate = useCallback((id) => revalidate(id), [revalidate])

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'baseline', mb: 2 }}>
        <Typography variant="h6" component="h2">
          Histórico
        </Typography>
      </Stack>

      {progresso ? (
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Validando em lote: {progresso.done} de {progresso.total}
          </Typography>
          <LinearProgress variant="determinate" value={(progresso.done / progresso.total) * 100} />
        </Stack>
      ) : null}

      <FilterBar
        filters={state.filters}
        options={options}
        onChange={handleFilter}
        onClear={handleClear}
        total={state.entries.length}
        visible={visible.length}
      />

      <HistoryTable
        entries={visible}
        sort={state.sort}
        onSort={handleSort}
        onRevalidate={handleRevalidate}
        onRemove={handleRemove}
        hasEntries={state.entries.length > 0}
      />
    </Paper>
  )
}
