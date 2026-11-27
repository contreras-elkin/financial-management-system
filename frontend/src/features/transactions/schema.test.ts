import { describe, expect, it } from 'vitest'
import { movementSchema, toAmount } from './schema'

function amountError(amount: string) {
  const result = movementSchema.safeParse({ amount })
  return result.success ? undefined : result.error.issues[0].message
}

describe('movementSchema', () => {
  it.each(['150000', '150000.5', '150000,50', ' 0,01 ', '9999999999999.99'])('accepts the amount %s', (amount) => {
    expect(amountError(amount)).toBeUndefined()
  })

  it('requires the amount', () => {
    expect(amountError('  ')).toBe('Ingresa el monto')
  })

  it.each(['abc', '-100', '150.000,00', '1,005', '12345678901234'])('rejects the amount %s', (amount) => {
    expect(amountError(amount)).toBe('Ingresa un monto válido, sin puntos de miles y con máximo 2 decimales')
  })

  it('rejects a zero amount', () => {
    expect(amountError('0,00')).toBe('El monto debe ser mayor a $ 0')
  })
})

describe('toAmount', () => {
  it('converts the decimal comma to a number', () => {
    expect(toAmount(' 150000,50 ')).toBe(150000.5)
    expect(toAmount('20000')).toBe(20000)
  })
})
