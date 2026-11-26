import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { ClientFormDialog } from './ClientFormDialog'
import { ClientsTable } from './ClientsTable'
import { useClients } from './hooks'
import type { Client } from './types'

/** Qué formulario está abierto: ninguno, el de alta o el de edición de un cliente. */
type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; client: Client }

export function ClientsPage() {
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  const closeForm = () => setForm({ mode: 'closed' })

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Clientes
        </Typography>
        <Button variant="contained" onClick={() => setForm({ mode: 'create' })}>
          Nuevo cliente
        </Button>
      </Stack>

      <ClientsContent onEdit={(client) => setForm({ mode: 'edit', client })} />

      {/* El diálogo se monta al abrirse y se desmonta al cerrarse: cada apertura empieza con el formulario limpio. */}
      {form.mode === 'create' && <ClientFormDialog onClose={closeForm} />}
      {form.mode === 'edit' && <ClientFormDialog client={form.client} onClose={closeForm} />}
    </>
  )
}

type ClientsContentProps = {
  onEdit: (client: Client) => void
}

/**
 * Componente contenedor: obtiene los datos con useClients y decide qué mostrar
 * según el estado de la consulta (cargando, error, sin datos o la tabla).
 */
function ClientsContent({ onEdit }: ClientsContentProps) {
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

  return <ClientsTable clients={clients} onEdit={onEdit} />
}
