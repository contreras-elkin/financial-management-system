export type FieldErrors = Record<string, string>

/**
 * Error de la API expresado en términos del front: los componentes no conocen
 * el formato ProblemDetail (RFC 9457) que devuelve el backend.
 * status 0 significa que no hubo respuesta (servidor caído o sin red).
 */
export class ApiError extends Error {
  readonly status: number
  readonly title: string
  readonly fieldErrors: FieldErrors

  constructor(status: number, title: string, message: string, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.title = title
    this.fieldErrors = fieldErrors
  }
}
