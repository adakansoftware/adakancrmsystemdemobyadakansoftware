import { describe, expect, it } from 'vitest'
import {
  formatCompact,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  toNumber,
} from '@/lib/format'

describe('formatCurrency', () => {
  it('formats whole amounts without fractions', () => {
    expect(formatCurrency(150000)).toBe('₺150.000')
    expect(formatCurrency(150000, 'USD', 'en')).toBe('$150,000')
  })
})

describe('formatCompact', () => {
  it('compacts large numbers', () => {
    expect(formatCompact(1500, 'en')).toBe('1.5K')
  })
})

describe('formatDate', () => {
  it('renders empty values as a dash', () => {
    expect(formatDate(null)).toBe('-')
    expect(formatDate(undefined)).toBe('-')
  })

  it('formats dates and date-like strings', () => {
    expect(formatDate(new Date('2026-11-10T00:00:00Z'), 'en')).toMatch(/Nov/)
    expect(formatDate('2026-11-10T00:00:00Z', 'en')).toMatch(/Nov/)
  })
})

describe('formatDateTime', () => {
  it('renders empty values as a dash', () => {
    expect(formatDateTime(null)).toBe('-')
  })

  it('includes the time part', () => {
    const formatted = formatDateTime(new Date('2026-11-10T14:30:00Z'), 'en')
    expect(formatted).toMatch(/\d{1,2}:\d{2}/)
    expect(formatted).not.toBe(formatDate(new Date('2026-11-10T14:30:00Z'), 'en'))
  })
})

describe('formatRelativeDate', () => {
  it('uses the empty label for missing values', () => {
    expect(formatRelativeDate(null)).toBe('Henuz yok')
  })

  it('marks today', () => {
    expect(formatRelativeDate(new Date())).toBe('Bugun')
  })

  it('uses hour buckets within a day', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
    expect(formatRelativeDate(threeHoursAgo)).toBe('3 saat once')

    const inThreeHours = new Date(Date.now() + 3 * 60 * 60 * 1000)
    expect(formatRelativeDate(inThreeHours)).toBe('3 saat sonra')
  })

  it('uses day buckets within a week', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    expect(formatRelativeDate(twoDaysAgo)).toBe('2 gun once')

    const inTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    expect(formatRelativeDate(inTwoDays)).toBe('2 gun sonra')
  })

  it('falls back to the absolute date beyond a week', () => {
    const value = new Date('2020-01-15T00:00:00Z')
    expect(formatRelativeDate(value)).toBe(formatDate(value))
  })
})

describe('toNumber', () => {
  it('normalizes null, number and decimal-like inputs', () => {
    expect(toNumber(null)).toBe(0)
    expect(toNumber(undefined)).toBe(0)
    expect(toNumber(42)).toBe(42)
    expect(toNumber({ toNumber: () => 7 })).toBe(7)
  })
})
