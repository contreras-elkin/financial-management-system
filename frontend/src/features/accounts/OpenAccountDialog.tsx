import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { Controller, useForm } from 'react-hook-form'
import { ApiError } from '../../shared/api/ApiError'
import { errorMessage } from '../../shared/api/errorMessage'
import { FormTextField } from '../../shared/components/FormTextField'
import type { Client } from '../clients/types'
import { accountErrorMessages } from './errorMessages'
import { useOpenAccount } from './hooks'
import { openAccountSchema, type OpenAccountValues } from './schema'
import { accountTypeLabels, accountTypes } from './types'

type OpenAccountDialogProps = {
  clients: Client[]
  // Cliente preseleccionado, por ejemplo el del filtro de la página.
  clientId?: number
  onClose: () => void
}

function initialValues(clientId?: number): OpenAccountValues {
  return { clientId: clientId === undefined ? '' : String(clientId), type: 'SAVINGS', gmfExempt: false }
}

export function OpenAccountDialog({ clients, clientId, onClose }: OpenAccountDialogProps) {
  const openAccount = useOpenAccount()

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(openAccountSchema),
    defaultValues: initialValues(clientId),
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await openAccount.mutateAsync({ ...values, clientId: Number(values.clientId) })
      onClose()
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error
      }
      setError('root.server', { message: errorMessage(error, accountErrorMessages) })
    }
  })

  return (
    <Dialog
      open
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="open-account-title"
    >
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle id="open-account-title">Abrir cuenta</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {errors.root?.server && <Alert severity="error">{errors.root.server.message}</Alert>}

            <FormTextField name="clientId" control={control} select label="Cliente" required>
              {clients.map((client) => (
                <MenuItem key={client.id} value={String(client.id)}>
                  {client.firstName} {client.lastName}
                </MenuItem>
              ))}
            </FormTextField>

            <FormTextField name="type" control={control} select label="Tipo de cuenta" required>
              {accountTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {accountTypeLabels[type]}
                </MenuItem>
              ))}
            </FormTextField>

            <Controller
              name="gmfExempt"
              control={control}
              render={({ field: { value, onChange } }) => (
                <FormControlLabel
                  control={<Switch checked={value} onChange={(event) => onChange(event.target.checked)} />}
                  label="Exenta de GMF (4 × 1.000)"
                />
              )}
            />

            <Typography variant="body2" color="text.secondary">
              La cuenta se abre activa y con saldo $ 0,00.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            Abrir cuenta
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
