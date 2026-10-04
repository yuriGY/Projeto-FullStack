import { useCallback, useMemo } from 'react'
import { Button, LinearProgress, Paper, Stack, Typography } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'

import FilterBar from './FilterBar'
import HistoryTable from './HistoryTable'
import { useValidation } from '../../hooks/useValidation'
import { useToast } from '../../hooks/useToast'
import { useValidationDispatch, useValidationState } from '../../state/validationContexts'
import { downloadCsv } from '../../utils/exportCsv'
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
  const toast = useToast()

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
  const handleSelect = useCallback(
    (id) => dispatch({ type: ACTIONS.SELECT_ENTRY, payload: { id } }),
    [dispatch],
  )
  const handleClear = useCallback(() => {
    const total = state.entries.length
    dispatch({ type: ACTIONS.CLEAR_HISTORY })
    toast('info', `Histórico limpo (${total} registro(s)). O cache foi preservado.`)
  }, [dispatch, toast, state.entries.length])
  const handleRevalidate = useCallback((id) => revalidate(id), [revalidate])

  /**
   * Exporta exatamente a fatia visível, não o histórico bruto, que é o que prova
   * que a exportação e os filtros compartilham o mesmo estado.
   */
  const handleExport = useCallback(() => {
    const total = downloadCsv(visible)
    toast('success', `${total} registro(s) exportado(s) em CSV.`)
  }, [visible, toast])

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
          Histórico
        </Typography>
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          disabled={visible.length === 0}
          onClick={handleExport}
        >
          Exportar CSV
        </Button>
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
        onSelect={handleSelect}
        onRevalidate={handleRevalidate}
        onRemove={handleRemove}
        hasEntries={state.entries.length > 0}
      />
    </Paper>
  )
}
