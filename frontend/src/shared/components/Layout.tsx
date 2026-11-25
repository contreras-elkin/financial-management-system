import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { NavLink, Outlet } from 'react-router'

const navItems = [{ label: 'Inicio', to: '/' }]

export function Layout() {
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
      <Container component="main" sx={{ py: 4, flexGrow: 1 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
