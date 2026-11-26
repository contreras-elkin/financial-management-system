import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import LinearProgress from '@mui/material/LinearProgress'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { NavLink, Outlet, useNavigation } from 'react-router'

const navItems = [
  { label: 'Inicio', to: '/' },
  { label: 'Clientes', to: '/clients' },
]

export function Layout() {
  // 'loading' mientras se descarga el código de una página diferida antes de mostrarla.
  const isNavigating = useNavigation().state === 'loading'

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
            Financial Management
          </Typography>
          <Box component="nav" aria-label="Navegación principal">
            {navItems.map((item) => (
              <Button key={item.to} component={NavLink} to={item.to} color="inherit">
                {item.label}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
      {isNavigating && <LinearProgress color="secondary" aria-label="Cargando página" />}
      <Container component="main" sx={{ py: 4, flexGrow: 1 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
