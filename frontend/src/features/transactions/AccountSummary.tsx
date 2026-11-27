import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { AccountStatusChip } from '../accounts/AccountStatusChip'
import { accountTypeLabels, type Account } from '../accounts/types'
import { formatCurrency } from '../../shared/format'

type AccountSummaryProps = {
  account: Account
  clientName: string
}

export function AccountSummary({ account, clientName }: AccountSummaryProps) {
  return (
    <Paper component="section" aria-label="Resumen de la cuenta" sx={{ p: 3, mb: 2 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Typography variant="h6" component="h2" sx={{ fontFamily: 'monospace' }}>
          {account.number}
        </Typography>
        <AccountStatusChip status={account.status} />
      </Stack>
      <Stack direction="row" sx={{ flexWrap: 'wrap', columnGap: 6, rowGap: 2 }}>
        <Figure label="Saldo">
          <Typography variant="h6" component="span" color={account.balance < 0 ? 'error.main' : undefined}>
            {formatCurrency(account.balance)}
          </Typography>
        </Figure>
        <Figure label="Disponible">
          <Typography variant="h6" component="span">
            {formatCurrency(account.availableBalance)}
          </Typography>
          {account.overdraftLimit > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Cupo {formatCurrency(account.overdraftLimit)}
            </Typography>
          )}
        </Figure>
        <Figure label="Tipo">
          <Typography>{accountTypeLabels[account.type]}</Typography>
        </Figure>
        <Figure label="Cliente">
          <Typography>{clientName}</Typography>
        </Figure>
      </Stack>
    </Paper>
  )
}

function Figure({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      {children}
    </div>
  )
}
