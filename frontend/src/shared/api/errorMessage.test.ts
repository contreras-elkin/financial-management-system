import { describe, expect, it } from 'vitest'
import { ApiError } from './ApiError'
import { errorMessage } from './errorMessage'

function apiError(status: number, code: string | null = null) {
  return new ApiError({ status, title: 'Title', message: 'Backend detail', code })
}

describe('errorMessage', () => {
  it('uses the message of the domain for its code', () => {
    const messages = { CLIENT_NOT_FOUND: 'El cliente no existe.' }

    expect(errorMessage(apiError(404, 'CLIENT_NOT_FOUND'), messages)).toBe('El cliente no existe.')
  })

  it('falls back to the common messages', () => {
    expect(errorMessage(apiError(400, 'VALIDATION_FAILED'))).toBe('Revisa los datos ingresados.')
  })

  it('uses a generic message for an unknown code or an error without code', () => {
    expect(errorMessage(apiError(409, 'SOMETHING_NEW'))).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    expect(errorMessage(apiError(502))).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
  })

  it('keeps the message of a network error, which is already written for the user', () => {
    const error = new ApiError({ status: 0, title: 'Network error', message: 'No fue posible conectar con el servidor' })

    expect(errorMessage(error)).toBe('No fue posible conectar con el servidor')
  })
})
