import { ApiError, type FieldErrors } from './ApiError'

/**
 * Ruta relativa: el navegador llama al mismo origen que sirve el front y el proxy
 * (Vite en desarrollo, nginx en Docker, CloudFront en AWS) la reenvía a la API.
 */
const BASE_URL = '/api'

type ProblemDetail = {
  title?: string
  detail?: string
  errors?: FieldErrors
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: HeadersInit = { Accept: 'application/json' }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Network error', 'No fue posible conectar con el servidor')
  }

  if (!response.ok) {
    throw await toApiError(response)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

async function toApiError(response: Response): Promise<ApiError> {
  const problem = await readProblemDetail(response)
  return new ApiError(
    response.status,
    problem?.title ?? response.statusText,
    problem?.detail ?? `La solicitud falló con el código ${response.status}`,
    problem?.errors ?? {},
  )
}

/**
 * Solo se interpreta el cuerpo si es JSON: un error del proxy (502, 504)
 * puede llegar como HTML y no debe romper el manejo del error.
 */
async function readProblemDetail(response: Response): Promise<ProblemDetail | null> {
  const contentType = response.headers.get('Content-Type') ?? ''
  if (!contentType.includes('json')) {
    return null
  }
  try {
    return (await response.json()) as ProblemDetail
  } catch {
    return null
  }
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  delete: (path: string) => request<void>('DELETE', path),
}
