import type { ErrorMessages } from '../../shared/api/errorMessage'

export const accountErrorMessages: ErrorMessages = {
  ACCOUNT_NOT_FOUND: 'La cuenta ya no existe. Actualiza la lista.',
  ACCOUNT_BALANCE_NOT_ZERO: 'Solo se puede cancelar una cuenta con saldo $ 0.',
  INVALID_ACCOUNT_STATUS_TRANSITION: 'La cuenta no admite ese cambio de estado.',
  GMF_EXEMPTION_ALREADY_ASSIGNED: 'El cliente ya tiene otra cuenta exenta de GMF.',
  INVALID_ACCOUNT_DATA: 'Los datos de la cuenta no son válidos.',
  CLIENT_NOT_FOUND: 'El cliente ya no existe. Actualiza la lista.',
}
