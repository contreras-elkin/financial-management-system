import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate, formatDateTime } from './format'

describe('format', () => {
  it('formats an ISO date as day/month/year without shifting the day', () => {
    expect(formatDate('1990-05-10')).toBe('10/05/1990')
  })

  it('formats an ISO date-time as day/month/year hours:minutes', () => {
    expect(formatDateTime('2026-11-24T08:05:30.123456')).toBe('24/11/2026 08:05')
  })

  it('formats an amount as Colombian pesos', () => {
    // Intl separa el símbolo con un espacio duro (U+00A0).
    expect(formatCurrency(2450000.5)).toBe('$ 2.450.000,50')
    expect(formatCurrency(0)).toBe('$ 0,00')
  })
})
