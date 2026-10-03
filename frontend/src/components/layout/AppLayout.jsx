import { AppBar, Box, Container, Stack, Toolbar, Typography } from '@mui/material'
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone'

export default function AppLayout({ children }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <PhoneIphoneIcon />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" component="h1" sx={{ lineHeight: 1.2 }}>
              ValidaFone
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              Central de Validação de Contatos
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>{children}</Stack>
      </Container>
    </Box>
  )
}
