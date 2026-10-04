import { useMemo } from 'react'
import { Alert, Box, Button, Divider, Paper, Stack, Tooltip, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import WarningIcon from '@mui/icons-material/Warning'

import BarList from './BarList'
import { buildStats } from './buildStats'
import { lineTypeLabel } from '../../services/lineTypes'
import { useValidationDispatch, useValidationState } from '../../state/validationContexts'
import { ACTIONS, filterEntries, selectFiltersActive } from '../../state/validationReducer'

/** Indicador isolado: um número só não é gráfico, é um número. */
function StatTile({ label, value, hint }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, flex: '1 1 150px', minWidth: 140 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="h4" component="p" sx={{ fontWeight: 500, lineHeight: 1.2, my: 0.5 }}>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      ) : null}
    </Paper>
  )
}

/**
 * Situação dos números.
 *
 * Usa a paleta de status, não as cores de série. Cada linha traz ícone e
 * rótulo junto do número: `warning` fica abaixo de 3:1 no fundo claro, então a
 * cor nunca pode ser o único portador do significado.
 */
function StatusBreakdown({ stats }) {
  const linhas = [
    { chave: 'validos', label: 'Válidos', valor: stats.validos, cor: 'viz.good', Icone: CheckCircleIcon },
    { chave: 'invalidos', label: 'Inválidos', valor: stats.invalidos, cor: 'viz.critical', Icone: CancelIcon },
    { chave: 'falhas', label: 'Falhas na consulta', valor: stats.falhas, cor: 'viz.warning', Icone: WarningIcon },
  ]
  const maior = linhas.reduce((max, linha) => Math.max(max, linha.valor), 0)

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Situação
      </Typography>

      {linhas.map((linha) => (
        <Tooltip key={linha.chave} title={`${linha.label}: ${linha.valor}`} placement="top">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75, minHeight: 24 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, width: { xs: 96, sm: 150 }, flexShrink: 0 }}>
              <linha.Icone sx={{ fontSize: 16, color: linha.cor, flexShrink: 0 }} />
              <Typography
                variant="body2"
                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {linha.label}
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1, height: 10, bgcolor: 'viz.track', borderRadius: '4px' }}>
              <Box
                sx={{
                  width: maior === 0 ? 0 : `${(linha.valor / maior) * 100}%`,
                  height: '100%',
                  bgcolor: linha.cor,
                  borderRadius: '0 4px 4px 0',
                }}
              />
            </Box>

            <Typography
              variant="body2"
              sx={{ width: 32, flexShrink: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
            >
              {linha.valor}
            </Typography>
          </Box>
        </Tooltip>
      ))}
    </Box>
  )
}

/**
 * Painel analítico.
 *
 * Analisa a mesma fatia que a tabela mostra: um filtro ativo na aba Histórico
 * também recorta os números daqui, com aviso visível e atalho para limpar.
 */
export default function StatsPanel() {
  const state = useValidationState()
  const dispatch = useValidationDispatch()

  const visible = useMemo(() => filterEntries(state.entries, state.filters), [state.entries, state.filters])
  const stats = useMemo(() => buildStats(visible), [visible])

  const filtrando = selectFiltersActive(state)
  const taxa = stats.taxaValidade === null ? '—' : `${Math.round(stats.taxaValidade * 100)}%`

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        Análise
      </Typography>

      {filtrando ? (
        <Alert
          severity="info"
          variant="outlined"
          sx={{ mb: 2 }}
          action={
            <Button size="small" color="inherit" onClick={() => dispatch({ type: ACTIONS.CLEAR_FILTERS })}>
              Limpar filtros
            </Button>
          }
        >
          Analisando {visible.length} de {state.entries.length} registros, porque há filtros ativos na aba
          Histórico.
        </Alert>
      ) : null}

      {stats.total === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          Nenhum registro para analisar.
        </Typography>
      ) : (
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
            <StatTile label="Consultas" value={stats.total} hint="no recorte atual" />
            <StatTile label="Taxa de validade" value={taxa} hint="entre os avaliados pela API" />
            <StatTile label="Via API" value={stats.viaApi} hint="consumiram cota" />
            <StatTile label="Via cache" value={stats.viaCache} hint="consultas economizadas" />
          </Stack>

          <Divider />

          <StatusBreakdown stats={stats} />

          <Divider />

          <BarList title="Por país" items={stats.porPais} />
          <BarList title="Por operadora" items={stats.porOperadora} />
          <BarList
            title="Por tipo de linha"
            items={stats.porTipoLinha.map((item) => ({ ...item, label: lineTypeLabel(item.label) }))}
          />
        </Stack>
      )}
    </Paper>
  )
}
