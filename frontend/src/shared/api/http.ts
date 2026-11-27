import { ApiError, type FieldErrors } from './ApiError'

/**
 * Ruta relativa: el navegador llama al mismo origen que sirve el front y el proxy
 * (Vite en desarrollo, nginx en Docker, CloudFront en AWS) la reenvía a la API.
 */
const BASE_URL = '/api'

type ProblemDetail = {
  title?: string
  detail?: string
  code?: string
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
    throw new ApiError({
      status: 0,
      title: 'Network error',
      message: 'No fue posible conectar con el servidor',
    })
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
  return new ApiError({
    status: response.status,
    title: problem?.title ?? response.statusText,
    message: problem?.detail ?? `La solicitud falló con el código ${response.status}`,
    code: problem?.code ?? null,
    fieldErrors: problem?.errors ?? {},
  })
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
  patch: <T>(path: string) => request<T>('PATCH', path),
  delete: (path: string) => request<void>('DELETE', path),
}
