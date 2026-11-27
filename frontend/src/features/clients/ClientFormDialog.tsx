import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import { useForm, type Path } from 'react-hook-form'
import { ApiError } from '../../shared/api/ApiError'
import { errorMessage } from '../../shared/api/errorMessage'
import { FormTextField } from '../../shared/components/FormTextField'
import { clientErrorMessages } from './errorMessages'
import { useCreateClient, useUpdateClient } from './hooks'
import { createClientSchema, type CreateClientValues } from './schema'
import { identificationTypeLabels, identificationTypes, type Client } from './types'

type ClientFormDialogProps = {
  /** Cliente a editar; si no se pasa, el diálogo registra uno nuevo. */
  client?: Client
  onClose: () => void
}

/** Errores del backend que corresponden a un campo concreto del formulario. */
const fieldByErrorCode: Record<string, Path<CreateClientValues>> = {
  CLIENT_ALREADY_EXISTS: 'identificationNumber',
  CLIENT_UNDERAGE: 'birthDate',
}

const emptyValues: CreateClientValues = {
  identificationType: 'CC',
  identificationNumber: '',
  firstName: '',
  lastName: '',
  email: '',
  birthDate: '',
}

/**
 * Formulario de alta y edición de clientes. React Hook Form guarda el estado del formulario
 * y valida con el esquema Zod antes de enviar; los errores del backend se muestran en el
 * campo al que corresponden o, si no son de un campo, en una alerta.
 * En edición la identificación se muestra pero no se envía, porque es inmutable.
 */
export function ClientFormDialog({ client, onClose }: ClientFormDialogProps) {
  const isEdit = client !== undefined
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createClientSchema),
    defaultValues: client ? toFormValues(client) : emptyValues,
  })

  function showServerError(error: unknown) {
    if (!(error instanceof ApiError)) {
      throw error
    }
    const field = error.code ? fieldByErrorCode[error.code] : undefined
    if (field) {
      setError(field, { message: errorMessage(error, clientErrorMessages) })
      return
    }
    const fieldErrors = Object.keys(error.fieldErrors).filter((name) => name in emptyValues)
    if (fieldErrors.length > 0) {
      fieldErrors.forEach((name) =>
        setError(name as Path<CreateClientValues>, { message: 'El servidor rechazó este valor.' }),
      )
      return
    }
    setError('root.server', { message: errorMessage(error, clientErrorMessages) })
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit) {
        const { firstName, lastName, email, birthDate } = values
        await updateClient.mutateAsync({ id: client.id, input: { firstName, lastName, email, birthDate } })
      } else {
        await createClient.mutateAsync(values)
      }
      onClose()
    } catch (error) {
      showServerError(error)
    }
  })

  const title = isEdit ? 'Editar cliente' : 'Nuevo cliente'

  return (
    <Dialog
      open
      onClose={isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="client-form-title"
    >
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle id="client-form-title">{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {errors.root?.server && <Alert severity="error">{errors.root.server.message}</Alert>}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormTextField
                name="identificationType"
                control={control}
                select
                label="Tipo de identificación"
                disabled={isEdit}
                sx={{ minWidth: 220 }}
              >
                {identificationTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {identificationTypeLabels[type]}
                  </MenuItem>
                ))}
              </FormTextField>
              <FormTextField
                name="identificationNumber"
                control={control}
                label="Número de identificación"
                disabled={isEdit}
                required
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormTextField name="firstName" control={control} label="Nombres" required fullWidth />
              <FormTextField name="lastName" control={control} label="Apellidos" required fullWidth />
            </Stack>

            <FormTextField name="email" control={control} type="email" label="Correo electrónico" required />

            <FormTextField
              name="birthDate"
              control={control}
              type="date"
              label="Fecha de nacimiento"
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            Guardar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

function toFormValues(client: Client): CreateClientValues {
  const { identificationType, identificationNumber, firstName, lastName, email, birthDate } = client
  return { identificationType, identificationNumber, firstName, lastName, email, birthDate }
}
