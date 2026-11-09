import { describe, expect, it } from 'vitest'
import { csvEscape, toCsv } from '@/lib/export/csv'
import { getExportEntityPermissions } from '@/lib/export/permissions'

describe('CSV export safety', () => {
  it('neutralizes formula injection values', () => {
    expect(csvEscape('=cmd|"/c calc"!A0')).toBe(`"'=cmd|""/c calc""!A0"`)
  })

  it('keeps normal values intact', () => {
    expect(csvEscape('normal')).toBe(`"normal"`)
  })

  it('escapes rows written by toCsv', () => {
    const csv = toCsv(['Ad'], [['=SUM(1,1)']])
    expect(csv).toContain(`"'=SUM(1,1)"`)
  })
})

describe('export permission mapping', () => {
  it('requires deal read permission for the dashboard export', () => {
    expect(getExportEntityPermissions('dashboard')).toContain('deals:read')
  })

  it('requires contacts:read for the contacts export', () => {
    expect(getExportEntityPermissions('contacts')[0]).toBe('contacts:read')
  })
})
