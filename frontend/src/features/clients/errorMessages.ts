import type { ErrorMessages } from '../../shared/api/errorMessage'

/** Mensajes en español para los códigos de error de clientes que envía el backend. */
export const clientErrorMessages: ErrorMessages = {
  CLIENT_NOT_FOUND: 'El cliente ya no existe. Actualiza la lista.',
  CLIENT_ALREADY_EXISTS: 'Ya existe un cliente con este tipo y número de identificación.',
  CLIENT_UNDERAGE: 'El cliente debe ser mayor de edad.',
  INVALID_CLIENT_DATA: 'Los datos del cliente no son válidos.',
}
