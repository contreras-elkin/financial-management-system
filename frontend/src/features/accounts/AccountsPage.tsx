import AddIcon from '@mui/icons-material/Add'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useClients } from '../clients/hooks'
import type { Client } from '../clients/types'
import { AccountsTable } from './AccountsTable'
import { useAccounts } from './hooks'
import { OpenAccountDialog } from './OpenAccountDialog'

const ALL_CLIENTS = ''

export function AccountsPage() {
  // El filtro vive en la URL (?clientId=7): se puede compartir el enlace y sobrevive a recargar.
  const [searchParams, setSearchParams] = useSearchParams()
  const clientIdParam = searchParams.get('clientId') ?? ALL_CLIENTS
  const clientId = clientIdParam === ALL_CLIENTS ? undefined : Number(clientIdParam)
  const { data: clients = [] } = useClients()
  const [opening, setOpening] = useState(false)

  const changeClient = (value: string) =>
    setSearchParams(value === ALL_CLIENTS ? {} : { clientId: value }, { replace: true })

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Cuentas
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpening(true)}>
          Abrir cuenta
        </Button>
      </Stack>

      <TextField
        select
        label="Cliente"
        size="small"
        value={clientIdParam}
        onChange={(event) => changeClient(event.target.value)}
        slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        sx={{ minWidth: 280, mb: 2, bgcolor: 'background.paper' }}
      >
        <MenuItem value={ALL_CLIENTS}>Todos los clientes</MenuItem>
        {clients.map((client) => (
          <MenuItem key={client.id} value={String(client.id)}>
            {fullName(client)}
          </MenuItem>
        ))}
      </TextField>

      <AccountsContent clientId={clientId} clients={clients} />

      {opening && <OpenAccountDialog clients={clients} clientId={clientId} onClose={() => setOpening(false)} />}
    </>
  )
}

function fullName(client: Client) {
  return `${client.firstName} ${client.lastName}`
}

function AccountsContent({ clientId, clients }: { clientId?: number; clients: Client[] }) {
  const { data: accounts, isPending, isError, refetch } = useAccounts(clientId)

  if (isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress aria-label="Cargando cuentas" />
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
        No fue posible cargar las cuentas.
      </Alert>
    )
  }

  if (accounts.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          {clientId === undefined ? 'No hay cuentas registradas.' : 'Este cliente no tiene cuentas.'}
        </Typography>
      </Paper>
    )
  }

  const namesById = new Map(clients.map((client) => [client.id, fullName(client)]))
  const clientName = (id: number) => namesById.get(id) ?? `Cliente ${id}`

  return <AccountsTable accounts={accounts} clientName={clientName} />
}
