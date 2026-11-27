import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import LinearProgress from '@mui/material/LinearProgress'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { NavLink, Outlet, useNavigation } from 'react-router'

const navItems = [
  { label: 'Inicio', to: '/' },
  { label: 'Clientes', to: '/clients' },
  { label: 'Cuentas', to: '/accounts' },
  { label: 'Movimientos', to: '/transactions' },
]

export function Layout() {
  // 'loading' mientras se descarga el código de una página diferida antes de mostrarla.
  const isNavigating = useNavigation().state === 'loading'

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="static"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <Box
            aria-hidden
            sx={{
              display: 'flex',
              p: 0.5,
              borderRadius: 1,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <AccountBalanceIcon fontSize="small" />
          </Box>
          <Typography variant="h6" component="span" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Financial Management
          </Typography>
          <Box component="nav" aria-label="Navegación principal" sx={{ display: 'flex', gap: 0.5 }}>
            {navItems.map((item) => (
              <Button
                key={item.to}
                component={NavLink}
                to={item.to}
                // 'end' evita que Inicio ('/') quede marcado en todas las rutas.
                end
                sx={{
                  color: 'text.secondary',
                  '&.active': {
                    color: 'primary.main',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
      {isNavigating && <LinearProgress aria-label="Cargando página" />}
      <Container component="main" sx={{ py: 4, flexGrow: 1 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
