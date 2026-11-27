import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useSearchParams } from 'react-router'
import { useAccounts } from '../accounts/hooks'
import { accountTypeLabels, type Account } from '../accounts/types'
import { fullName } from '../clients/format'
import { useClients } from '../clients/hooks'
import { AccountSummary } from './AccountSummary'
import { useAccountTransactions } from './hooks'
import { TransactionsTable } from './TransactionsTable'

const NO_ACCOUNT = ''

export function TransactionsPage() {
  // La cuenta vive en la URL (?accountId=5), igual que el filtro de cuentas.
  const [searchParams, setSearchParams] = useSearchParams()
  const accountIdParam = searchParams.get('accountId') ?? NO_ACCOUNT
  const { data: accounts, isPending, isError, refetch } = useAccounts()
  const { data: clients = [] } = useClients()

  const namesById = new Map(clients.map((client) => [client.id, fullName(client)]))
  const clientName = (id: number) => namesById.get(id) ?? `Cliente ${id}`
  const account = accounts?.find((candidate) => String(candidate.id) === accountIdParam)

  const changeAccount = (value: string) => setSearchParams(value === NO_ACCOUNT ? {} : { accountId: value }, { replace: true })

  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Movimientos
      </Typography>

      {isPending && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Cargando cuentas" />
        </Box>
      )}

      {isError && (
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
      )}

      {accounts && (
        <>
          <TextField
            select
            label="Cuenta"
            size="small"
            value={account ? accountIdParam : NO_ACCOUNT}
            onChange={(event) => changeAccount(event.target.value)}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            sx={{ minWidth: 360, mb: 2, bgcolor: 'background.paper' }}
          >
            <MenuItem value={NO_ACCOUNT} disabled>
              Selecciona una cuenta
            </MenuItem>
            {accounts.map((option) => (
              <MenuItem key={option.id} value={String(option.id)}>
                {accountLabel(option, clientName(option.clientId))}
              </MenuItem>
            ))}
          </TextField>

          {account ? (
            <>
              <AccountSummary account={account} clientName={clientName(account.clientId)} />
              <TransactionsContent account={account} accounts={accounts} />
            </>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {accountIdParam === NO_ACCOUNT
                  ? 'Selecciona una cuenta para ver sus movimientos.'
                  : 'La cuenta seleccionada no existe.'}
              </Typography>
            </Paper>
          )}
        </>
      )}
    </>
  )
}

function accountLabel(account: Account, clientName: string) {
  return `${account.number} · ${accountTypeLabels[account.type]} · ${clientName}`
}

type TransactionsContentProps = {
  account: Account
  accounts: Account[]
}

function TransactionsContent({ account, accounts }: TransactionsContentProps) {
  const { data: transactions, isPending, isError, refetch } = useAccountTransactions(account.id)

  if (isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress aria-label="Cargando movimientos" />
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
        No fue posible cargar los movimientos.
      </Alert>
    )
  }

  if (transactions.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Esta cuenta no tiene movimientos.</Typography>
      </Paper>
    )
  }

  const numbersById = new Map(accounts.map((candidate) => [candidate.id, candidate.number]))
  const accountNumber = (id: number) => numbersById.get(id) ?? `Cuenta ${id}`

  return <TransactionsTable transactions={transactions} accountNumber={accountNumber} />
}
