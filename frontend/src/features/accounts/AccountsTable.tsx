import BlockIcon from '@mui/icons-material/Block'
import PauseCircleOutlinedIcon from '@mui/icons-material/PauseCircleOutlined'
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { formatCurrency, formatDateTime } from '../../shared/format'
import { AccountStatusChip } from './AccountStatusChip'
import { accountTypeLabels, type Account, type AccountStatus, type AccountStatusAction } from './types'

const actionButtons = {
  activate: { label: 'Activar', Icon: PlayCircleOutlinedIcon },
  inactivate: { label: 'Inactivar', Icon: PauseCircleOutlinedIcon },
  cancel: { label: 'Cancelar', Icon: BlockIcon },
} satisfies Record<AccountStatusAction, unknown>

// Mismas transiciones que AccountStatus.canTransitionTo del backend; una cancelada ya no admite cambios.
function availableActions(status: AccountStatus): AccountStatusAction[] {
  switch (status) {
    case 'ACTIVE':
      return ['inactivate', 'cancel']
    case 'INACTIVE':
      return ['activate', 'cancel']
    case 'CANCELLED':
      return []
  }
}

type AccountsTableProps = {
  accounts: Account[]
  clientName: (clientId: number) => string
  // Sin acciones, la tabla es de solo lectura.
  onChangeStatus?: (account: Account, action: AccountStatusAction) => void
}

export function AccountsTable({ accounts, clientName, onChangeStatus }: AccountsTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="Cuentas">
        <TableHead>
          <TableRow>
            <TableCell>Número</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Cliente</TableCell>
            <TableCell align="right">Saldo</TableCell>
            <TableCell align="right">Disponible</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Fecha de creación</TableCell>
            <TableCell>Última modificación</TableCell>
            {onChangeStatus && <TableCell align="right">Acciones</TableCell>}
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
              <TableCell
                align="right"
                sx={{ whiteSpace: 'nowrap', color: account.balance < 0 ? 'error.main' : undefined }}
              >
                {formatCurrency(account.balance)}
              </TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                {formatCurrency(account.availableBalance)}
                {account.overdraftLimit > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Cupo {formatCurrency(account.overdraftLimit)}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <AccountStatusChip status={account.status} />
              </TableCell>
              <TableCell>{formatDateTime(account.createdAt)}</TableCell>
              <TableCell>{formatDateTime(account.updatedAt)}</TableCell>
              {onChangeStatus && (
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  {availableActions(account.status).map((action) => {
                    const { label, Icon } = actionButtons[action]
                    return (
                      <Tooltip key={action} title={label}>
                        <IconButton
                          size="small"
                          onClick={() => onChangeStatus(account, action)}
                          aria-label={`${label} la cuenta ${account.number}`}
                          sx={action === 'cancel' ? { '&:hover': { color: 'error.main' } } : undefined}
                        >
                          <Icon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )
                  })}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
