import type { ErrorMessages } from '../../shared/api/errorMessage'

export const transactionErrorMessages: ErrorMessages = {
  ACCOUNT_NOT_FOUND: 'La cuenta ya no existe. Actualiza la página.',
  ACCOUNT_NOT_ACTIVE: 'Solo se pueden hacer movimientos en cuentas activas.',
  INSUFFICIENT_FUNDS: 'La cuenta no tiene saldo disponible suficiente.',
  INVALID_TRANSACTION_DATA: 'Los datos del movimiento no son válidos.',
}
