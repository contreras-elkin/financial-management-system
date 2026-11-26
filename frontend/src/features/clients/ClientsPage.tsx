import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { ClientsTable } from './ClientsTable'
import { useClients } from './hooks'

export function ClientsPage() {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Clientes
      </Typography>
      <ClientsContent />
    </>
  )
}

/**
 * Componente contenedor: obtiene los datos con useClients y decide qué mostrar
 * según el estado de la consulta (cargando, error, sin datos o la tabla).
 */
function ClientsContent() {
  const { data: clients, isPending, isError, refetch } = useClients()

  if (isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress aria-label="Cargando clientes" />
      </Box>
    )
  }

  if (isError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => refetch()}>
            Reintentar
          </Button>
        }
      >
        No fue posible cargar los clientes.
      </Alert>
    )
  }

  if (clients.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">No hay clientes registrados.</Typography>
      </Paper>
    )
  }

  return <ClientsTable clients={clients} />
}
