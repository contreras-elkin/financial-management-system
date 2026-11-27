import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createClientSchema, updateClientSchema } from './schema'
import type { CreateClientInput, UpdateClientInput } from './types'

const valid = {
  identificationType: 'CC',
  identificationNumber: '100',
  firstName: 'Ana',
  lastName: 'Ruiz',
  email: 'ana@mail.com',
  birthDate: '1990-05-10',
}

/** Primer mensaje de error de cada campo, o un objeto vacío si los datos son válidos. */
function errorsOf(schema: z.ZodType, data: unknown): Record<string, string | undefined> {
  const result = schema.safeParse(data)
  if (result.success) {
    return {}
  }
  const { fieldErrors } = z.flattenError(result.error) as { fieldErrors: Record<string, string[]> }
  return Object.fromEntries(Object.entries(fieldErrors).map(([field, messages]) => [field, messages[0]]))
}

describe('createClientSchema', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 26, 12, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('accepts valid data and trims the text fields', () => {
    const input: CreateClientInput = createClientSchema.parse({
      ...valid,
      firstName: '  Ana  ',
      email: ' ana@mail.com ',
    })

    expect(input.firstName).toBe('Ana')
    expect(input.email).toBe('ana@mail.com')
  })

  it('requires every field', () => {
    const errors = errorsOf(createClientSchema, {
      identificationType: '',
      identificationNumber: '   ',
      firstName: '',
      lastName: '',
      email: '',
      birthDate: '',
    })

    expect(errors).toEqual({
      identificationType: 'Selecciona el tipo de identificación',
      identificationNumber: 'El número de identificación es obligatorio',
      firstName: 'El nombre debe tener al menos 2 caracteres',
      lastName: 'El apellido debe tener al menos 2 caracteres',
      email: 'El correo electrónico es obligatorio',
      birthDate: 'La fecha de nacimiento es obligatoria',
    })
  })

  it('rejects names shorter than 2 characters after trimming', () => {
    expect(errorsOf(createClientSchema, { ...valid, firstName: ' A ' }).firstName).toBe(
      'El nombre debe tener al menos 2 caracteres',
    )
  })

  it('applies the maximum lengths of the database', () => {
    const errors = errorsOf(createClientSchema, {
      ...valid,
      identificationNumber: '1'.repeat(21),
      lastName: 'a'.repeat(101),
      email: `${'a'.repeat(140)}@mail.com.co`,
    })

    expect(Object.keys(errors).sort()).toEqual(['email', 'identificationNumber', 'lastName'])
  })

  it.each(['ana', 'ana@mail', 'ana@mail.c', 'ana mail@mail.com'])('rejects the email %s', (email) => {
    expect(errorsOf(createClientSchema, { ...valid, email }).email).toBe(
      'El correo debe tener el formato usuario@dominio.com',
    )
  })

  it('rejects a date that does not exist', () => {
    expect(errorsOf(createClientSchema, { ...valid, birthDate: '1990-02-31' }).birthDate).toBe(
      'La fecha de nacimiento no es válida',
    )
  })

  it('rejects a future birth date', () => {
    expect(errorsOf(createClientSchema, { ...valid, birthDate: '2027-01-01' }).birthDate).toBe(
      'La fecha de nacimiento debe ser anterior a hoy',
    )
  })

  it('accepts a client who turns 18 today and rejects one who turns 18 tomorrow', () => {
    expect(errorsOf(createClientSchema, { ...valid, birthDate: '2008-11-26' })).toEqual({})
    expect(errorsOf(createClientSchema, { ...valid, birthDate: '2008-11-27' }).birthDate).toBe(
      'El cliente debe ser mayor de edad (18 años o más)',
    )
  })

  it('treats a client born on February 29 as an adult from March 1', () => {
    vi.setSystemTime(new Date(2026, 1, 28, 12, 0, 0))
    expect(errorsOf(createClientSchema, { ...valid, birthDate: '2008-02-29' }).birthDate).toBeDefined()

    vi.setSystemTime(new Date(2026, 2, 1, 12, 0, 0))
    expect(errorsOf(createClientSchema, { ...valid, birthDate: '2008-02-29' })).toEqual({})
  })
})

describe('updateClientSchema', () => {
  it('validates the personal data without the identification', () => {
    const { firstName, lastName, email, birthDate } = valid
    const input: UpdateClientInput = updateClientSchema.parse({ firstName, lastName, email, birthDate })

    expect(input).toEqual({ firstName, lastName, email, birthDate })
    expect(errorsOf(updateClientSchema, { ...input, email: 'ana' }).email).toBeDefined()
  })
})
