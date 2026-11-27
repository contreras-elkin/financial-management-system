export type FieldErrors = Record<string, string>

type ApiErrorInit = {
  status: number
  title: string
  message: string
  code?: string | null
  fieldErrors?: FieldErrors
}

/**
 * Error de la API expresado en términos del front: los componentes no conocen
 * el formato ProblemDetail (RFC 9457) que devuelve el backend.
 * status 0 significa que no hubo respuesta (servidor caído o sin red).
 * code es el identificador estable del error que envía el backend (por ejemplo
 * CLIENT_ALREADY_EXISTS); es null cuando la respuesta no lo trae.
 */
export class ApiError extends Error {
  readonly status: number
  readonly title: string
  readonly code: string | null
  readonly fieldErrors: FieldErrors

  constructor({ status, title, message, code = null, fieldErrors = {} }: ApiErrorInit) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.title = title
    this.code = code
    this.fieldErrors = fieldErrors
  }
}
