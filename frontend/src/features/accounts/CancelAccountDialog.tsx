import { errorMessage } from '../../shared/api/errorMessage'
import { ConfirmDialog } from '../../shared/components/ConfirmDialog'
import { accountErrorMessages } from './errorMessages'
import { useChangeAccountStatus } from './hooks'
import type { Account } from './types'

type CancelAccountDialogProps = {
  account: Account
  onClose: () => void
}

export function CancelAccountDialog({ account, onClose }: CancelAccountDialogProps) {
  const changeStatus = useChangeAccountStatus()

  return (
    <ConfirmDialog
      title="Cancelar cuenta"
      confirmLabel="Cancelar cuenta"
      closeLabel="Volver"
      pending={changeStatus.isPending}
      error={changeStatus.error ? errorMessage(changeStatus.error, accountErrorMessages) : undefined}
      onConfirm={() => changeStatus.mutate({ id: account.id, action: 'cancel' }, { onSuccess: onClose })}
      onClose={onClose}
    >
      ¿Cancelar la cuenta {account.number}? Solo se puede cancelar con saldo $ 0 y no se puede reactivar.
    </ConfirmDialog>
  )
}
