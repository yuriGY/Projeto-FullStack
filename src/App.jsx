import { Suspense, lazy, useCallback, useMemo, useState } from 'react'
import { Box, CircularProgress, CssBaseline, Paper, Tab, Tabs, ThemeProvider } from '@mui/material'

import AppLayout from './components/layout/AppLayout'
import ValidationForm from './components/form/ValidationForm'
import ResultCard from './components/result/ResultCard'
import HistoryPanel from './components/history/HistoryPanel'
import DetailDrawer from './components/detail/DetailDrawer'
import ToastHost from './components/feedback/ToastHost'
import { ValidationProvider } from './state/ValidationProvider'
import { buildTheme } from './theme'

/**
 * O painel analítico só é baixado quando a aba Análise é aberta.
 *
 * Ele arrasta consigo as agregações (`buildStats`) e o componente de barras,
 * que ficam num chunk próprio, visível como uma requisição separada na aba
 * Network na primeira vez que a aba é acionada.
 */
const StatsPanel = lazy(() => import('./components/stats/StatsPanel'))

const THEME_KEY = 'validafone:theme'

function readStoredMode() {
  try {
    const salvo = window.localStorage.getItem(THEME_KEY)
    return salvo === 'dark' || salvo === 'light' ? salvo : 'light'
  } catch {
    return 'light'
  }
}

function PanelFallback() {
  return (
    <Paper variant="outlined" sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
      <CircularProgress size={28} />
    </Paper>
  )
}

export default function App() {
  const [mode, setMode] = useState(readStoredMode)
  const [tab, setTab] = useState('historico')

  const theme = useMemo(() => buildTheme(mode), [mode])

  const toggleMode = useCallback(() => {
    setMode((anterior) => {
      const proximo = anterior === 'dark' ? 'light' : 'dark'
      try {
        window.localStorage.setItem(THEME_KEY, proximo)
      } catch {
      }
      return proximo
    })
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ValidationProvider>
        <AppLayout mode={mode} onToggleMode={toggleMode}>
          <ValidationForm />
          <ResultCard />

          <Box>
            <Tabs
              value={tab}
              onChange={(_event, valor) => setTab(valor)}
              sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab value="historico" label="Histórico" />
              <Tab value="analise" label="Análise" />
            </Tabs>

            {tab === 'historico' ? (
              <HistoryPanel />
            ) : (
              <Suspense fallback={<PanelFallback />}>
                <StatsPanel />
              </Suspense>
            )}
          </Box>
        </AppLayout>

        <DetailDrawer />
        <ToastHost />
      </ValidationProvider>
    </ThemeProvider>
  )
}
