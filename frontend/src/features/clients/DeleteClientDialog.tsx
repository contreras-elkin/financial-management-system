import { errorMessage } from '../../shared/api/errorMessage'
import { ConfirmDialog } from '../../shared/components/ConfirmDialog'
import { clientErrorMessages } from './errorMessages'
import { useDeleteClient } from './hooks'
import type { Client } from './types'

type DeleteClientDialogProps = {
  client: Client
  onClose: () => void
}

/** Pide confirmación antes de eliminar un cliente y muestra el error del backend si falla. */
export function DeleteClientDialog({ client, onClose }: DeleteClientDialogProps) {
  const deleteClient = useDeleteClient()

  return (
    <ConfirmDialog
      title="Eliminar cliente"
      confirmLabel="Eliminar"
      pending={deleteClient.isPending}
      error={deleteClient.error ? errorMessage(deleteClient.error, clientErrorMessages) : undefined}
      onConfirm={() => deleteClient.mutate(client.id, { onSuccess: onClose })}
      onClose={onClose}
    >
      ¿Eliminar a {client.firstName} {client.lastName} ({client.identificationType}{' '}
      {client.identificationNumber})? Esta acción no se puede deshacer.
    </ConfirmDialog>
  )
}
