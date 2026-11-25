import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Página no encontrada
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        La dirección que buscas no existe.
      </Typography>
      <Button component={Link} to="/" variant="contained">
        Volver al inicio
      </Button>
    </>
  )
}
