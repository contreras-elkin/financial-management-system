import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useForm } from 'react-hook-form'
import { ApiError } from '../../shared/api/ApiError'
import { errorMessage } from '../../shared/api/errorMessage'
import { FormTextField } from '../../shared/components/FormTextField'
import { formatCurrency } from '../../shared/format'
import type { Account } from '../accounts/types'
import { transactionErrorMessages } from './errorMessages'
import { useDeposit, useWithdraw } from './hooks'
import { movementSchema, toAmount } from './schema'
import { movementLabels, type MovementKind } from './types'

type MovementDialogProps = {
  kind: MovementKind
  account: Account
  onClose: () => void
}

export function MovementDialog({ kind, account, onClose }: MovementDialogProps) {
  const deposit = useDeposit()
  const withdraw = useWithdraw()
  const mutation = kind === 'deposit' ? deposit : withdraw
  const label = movementLabels[kind]

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(movementSchema),
    defaultValues: { amount: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync({ accountId: account.id, amount: toAmount(values.amount) })
      onClose()
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error
      }
      // Fondos insuficientes o un monto rechazado se explican junto al campo; el resto, en la alerta.
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
      maxWidth="xs"
      aria-labelledby="movement-title"
    >
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle id="movement-title">{label}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {errors.root?.server && <Alert severity="error">{errors.root.server.message}</Alert>}

            <Typography variant="body2" color="text.secondary">
              Cuenta <strong>{account.number}</strong> · Disponible {formatCurrency(account.availableBalance)}
            </Typography>

            <FormTextField
              name="amount"
              control={control}
              label="Monto"
              required
              autoFocus
              helperText="Sin puntos de miles. Ejemplo: 150000,50"
              slotProps={{
                htmlInput: { inputMode: 'decimal' },
                input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {label}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
