import type { ApiError } from './ApiError'

export type ErrorMessages = Record<string, string>

/** Mensajes de los códigos que no pertenecen a un dominio concreto. */
const commonMessages: ErrorMessages = {
  VALIDATION_FAILED: 'Revisa los datos ingresados.',
  DATA_INTEGRITY_VIOLATION: 'La operación entra en conflicto con los datos actuales. Actualiza la página e intenta de nuevo.',
}

const UNEXPECTED_ERROR = 'Ocurrió un error inesperado. Intenta de nuevo.'

/**
 * Traduce un error de la API a un mensaje para el usuario a partir de su código estable.
 * Primero se buscan los mensajes del dominio (`messages`), luego los comunes.
 * Nunca se muestra el `detail` del backend: está en inglés y está pensado para depurar.
 */
export function errorMessage(error: ApiError, messages: ErrorMessages = {}): string {
  if (error.status === 0) {
    return error.message
  }
  if (error.code) {
    return messages[error.code] ?? commonMessages[error.code] ?? UNEXPECTED_ERROR
  }
  return UNEXPECTED_ERROR
}
