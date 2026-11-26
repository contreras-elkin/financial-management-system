import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './ApiError'
import { http } from './http'

const fetchMock = vi.fn<typeof fetch>()

function jsonResponse(status: number, body: unknown, contentType = 'application/json') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': contentType },
  })
}

async function captureError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError)
    return error as ApiError
  }
  throw new Error('Expected the request to fail')
}

describe('http', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('returns the parsed body of a successful response', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, [{ id: 1 }]))

    const result = await http.get<{ id: number }[]>('/clients')

    expect(result).toEqual([{ id: 1 }])
    expect(fetchMock).toHaveBeenCalledWith('/api/clients', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      body: undefined,
    })
  })

  it('sends the body as JSON', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 1 }))

    await http.post('/clients', { firstName: 'Ana' })

    expect(fetchMock).toHaveBeenCalledWith('/api/clients', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: '{"firstName":"Ana"}',
    })
  })

  it('returns undefined for a response without content', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(http.delete('/clients/1')).resolves.toBeUndefined()
  })

  it('maps a problem detail to an ApiError', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        404,
        { title: 'Resource not found', detail: 'Client 99 not found', code: 'CLIENT_NOT_FOUND' },
        'application/problem+json',
      ),
    )

    const error = await captureError(http.get('/clients/99'))

    expect(error.status).toBe(404)
    expect(error.title).toBe('Resource not found')
    expect(error.message).toBe('Client 99 not found')
    expect(error.code).toBe('CLIENT_NOT_FOUND')
    expect(error.fieldErrors).toEqual({})
  })

  it('exposes the field errors of a validation problem', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        400,
        {
          title: 'Invalid request',
          detail: 'One or more fields are invalid',
          code: 'VALIDATION_FAILED',
          errors: { email: 'must be a well-formed email address' },
        },
        'application/problem+json',
      ),
    )

    const error = await captureError(http.post('/clients', {}))

    expect(error.status).toBe(400)
    expect(error.code).toBe('VALIDATION_FAILED')
    expect(error.fieldErrors).toEqual({ email: 'must be a well-formed email address' })
  })

  it('uses a generic message when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>Bad Gateway</html>', {
        status: 502,
        statusText: 'Bad Gateway',
        headers: { 'Content-Type': 'text/html' },
      }),
    )

    const error = await captureError(http.get('/clients'))

    expect(error.status).toBe(502)
    expect(error.title).toBe('Bad Gateway')
    expect(error.message).toBe('La solicitud falló con el código 502')
    expect(error.code).toBeNull()
  })

  it('maps a network failure to an ApiError with status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const error = await captureError(http.get('/clients'))

    expect(error.status).toBe(0)
    expect(error.message).toBe('No fue posible conectar con el servidor')
    expect(error.code).toBeNull()
  })
})
