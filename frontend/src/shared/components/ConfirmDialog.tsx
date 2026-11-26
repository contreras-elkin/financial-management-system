import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import type { ReactNode } from 'react'

type ConfirmDialogProps = {
  title: string
  children: ReactNode
  confirmLabel: string
  /** Mientras la acción está en curso no se puede cerrar ni confirmar de nuevo. */
  pending?: boolean
  error?: string
  onConfirm: () => void
  onClose: () => void
}

/**
 * Diálogo de confirmación para acciones que no se pueden deshacer (eliminar, cancelar).
 * Solo presenta: quien lo usa decide qué hace la acción y qué error mostrar.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  pending = false,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open onClose={pending ? undefined : onClose} aria-labelledby="confirm-dialog-title">
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <DialogContentText>{children}</DialogContentText>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" loading={pending}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
