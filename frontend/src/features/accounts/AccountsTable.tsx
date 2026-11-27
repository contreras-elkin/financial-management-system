import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import { formatCurrency, formatDateTime } from '../../shared/format'
import { AccountStatusChip } from './AccountStatusChip'
import { accountTypeLabels, type Account } from './types'

type AccountsTableProps = {
  accounts: Account[]
  clientName: (clientId: number) => string
}

export function AccountsTable({ accounts, clientName }: AccountsTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="Cuentas">
        <TableHead>
          <TableRow>
            <TableCell>Número</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Cliente</TableCell>
            <TableCell align="right">Saldo</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Fecha de creación</TableCell>
            <TableCell>Última modificación</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id} hover>
              <TableCell sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                {account.number}
                {account.gmfExempt && (
                  <Tooltip title="Exenta de GMF">
                    <VerifiedUserOutlinedIcon
                      titleAccess="Exenta de GMF"
                      fontSize="small"
                      color="primary"
                      sx={{ ml: 1, verticalAlign: 'middle' }}
                    />
                  </Tooltip>
                )}
              </TableCell>
              <TableCell>{accountTypeLabels[account.type]}</TableCell>
              <TableCell>{clientName(account.clientId)}</TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                {formatCurrency(account.balance)}
              </TableCell>
              <TableCell>
                <AccountStatusChip status={account.status} />
              </TableCell>
              <TableCell>{formatDateTime(account.createdAt)}</TableCell>
              <TableCell>{formatDateTime(account.updatedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
