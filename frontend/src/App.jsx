import { CssBaseline, ThemeProvider } from '@mui/material'

import AppLayout from './components/layout/AppLayout'
import ValidationForm from './components/form/ValidationForm'
import ResultCard from './components/result/ResultCard'
import { ValidationProvider } from './state/ValidationProvider'
import { theme } from './theme'

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ValidationProvider>
        <AppLayout>
          <ValidationForm />
          <ResultCard />
        </AppLayout>
      </ValidationProvider>
    </ThemeProvider>
  )
}
