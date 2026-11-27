import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useForm } from 'react-hook-form'
import { ApiError } from '../../shared/api/ApiError'
import { errorMessage } from '../../shared/api/errorMessage'
import { FormTextField } from '../../shared/components/FormTextField'
import { formatCurrency } from '../../shared/format'
import { accountLabel } from '../accounts/format'
import type { Account } from '../accounts/types'
import { transactionErrorMessages } from './errorMessages'
import { useTransfer } from './hooks'
import { toAmount, transferSchema } from './schema'

type TransferDialogProps = {
  source: Account
  accounts: Account[]
  clientName: (clientId: number) => string
  onClose: () => void
}

export function TransferDialog({ source, accounts, clientName, onClose }: TransferDialogProps) {
  const transfer = useTransfer()
  // El backend rechaza la misma cuenta y las no activas: no se ofrecen como destino.
  const destinations = accounts.filter((account) => account.id !== source.id && account.status === 'ACTIVE')

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: { targetAccountId: '', amount: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await transfer.mutateAsync({
        sourceAccountId: source.id,
        targetAccountId: Number(values.targetAccountId),
        amount: toAmount(values.amount),
      })
      onClose()
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error
      }
      const isAmountError = error.code === 'INSUFFICIENT_FUNDS' || 'amount' in error.fieldErrors
      setError(isAmountError ? 'amount' : 'root.server', {
        message: errorMessage(error, transactionErrorMessages),
      })
    }
  })

  return (
    <Dialog
      open
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="transfer-title"
    >
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle id="transfer-title">Transferir</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {errors.root?.server && <Alert severity="error">{errors.root.server.message}</Alert>}

            <Typography variant="body2" color="text.secondary">
              Desde <strong>{source.number}</strong> · Disponible {formatCurrency(source.availableBalance)}
            </Typography>

            {destinations.length === 0 ? (
              <Alert severity="info">No hay otras cuentas activas que puedan recibir la transferencia.</Alert>
            ) : (
              <>
                <FormTextField name="targetAccountId" control={control} select label="Cuenta destino" required>
                  {destinations.map((account) => (
                    <MenuItem key={account.id} value={String(account.id)}>
                      {accountLabel(account, clientName(account.clientId))}
                    </MenuItem>
                  ))}
                </FormTextField>

                <FormTextField
                  name="amount"
                  control={control}
                  label="Monto"
                  required
                  helperText="Sin puntos de miles. Ejemplo: 150000,50"
                  slotProps={{
                    htmlInput: { inputMode: 'decimal' },
                    input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                  }}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting} disabled={destinations.length === 0}>
            Transferir
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
