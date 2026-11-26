import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime } from './format'

describe('format', () => {
  it('formats an ISO date as day/month/year without shifting the day', () => {
    expect(formatDate('1990-05-10')).toBe('10/05/1990')
  })

  it('formats an ISO date-time as day/month/year hours:minutes', () => {
    expect(formatDateTime('2026-11-24T08:05:30.123456')).toBe('24/11/2026 08:05')
  })
})
