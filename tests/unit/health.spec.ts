import { describe, expect, it } from 'vitest'
import { buildHealthSummary } from '@/lib/health'

describe('buildHealthSummary', () => {
  it('reports a healthy workspace as ok', () => {
    const summary = buildHealthSummary({
      appUrlConfigured: true,
      sessionSecretConfigured: true,
      databaseConfigured: true,
      directUrlConfigured: true,
      databaseOk: true,
      userCount: 4,
    })

    expect(summary.ok).toBe(true)
    expect(summary.status).toBe('ok')
    expect(summary.envReady).toBe(true)
    expect(summary.envWarnings).toHaveLength(0)
  })

  it('reports missing optional config as warn', () => {
    const summary = buildHealthSummary({
      appUrlConfigured: false,
      sessionSecretConfigured: true,
      databaseConfigured: true,
      directUrlConfigured: false,
      databaseOk: true,
      userCount: 0,
    })

    expect(summary.ok).toBe(false)
    expect(summary.status).toBe('warn')
    expect(summary.envWarnings.length).toBeGreaterThanOrEqual(1)
  })

  it('reports missing required config as error', () => {
    const summary = buildHealthSummary({
      appUrlConfigured: false,
      sessionSecretConfigured: false,
      databaseConfigured: false,
      directUrlConfigured: false,
      databaseOk: false,
      userCount: 0,
    })

    expect(summary.ok).toBe(false)
    expect(summary.status).toBe('error')
    expect(summary.envReady).toBe(false)
  })
})
