import { describe, expect, it } from 'vitest'
import { createEnv } from '@/lib/env'

describe('createEnv', () => {
  it('fails closed in production without a session secret', () => {
    expect(() =>
      createEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://db',
      }),
    ).toThrowError(/NEXTAUTH_SECRET/)
  })

  it('falls back to a runtime dev secret outside production', () => {
    const devEnv = createEnv({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://db',
    })

    expect(devEnv.sessionSecretConfigured).toBe(false)
    expect(devEnv.sessionSecret.length).toBeGreaterThanOrEqual(32)
  })

  it('keeps the fallback state flag during the production build phase', () => {
    const buildEnv = createEnv({
      NODE_ENV: 'production',
      NEXT_PHASE: 'phase-production-build',
      DATABASE_URL: 'postgresql://db',
    })

    expect(buildEnv.sessionSecretConfigured).toBe(false)
  })

  it('detects a fully configured production environment', () => {
    const productionEnv = createEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://db',
      NEXTAUTH_SECRET: 'production-secret',
      APP_URL: 'https://crm.example.com',
    })

    expect(productionEnv.sessionSecretConfigured).toBe(true)
    expect(productionEnv.appUrlConfigured).toBe(true)
    expect(productionEnv.rateLimitStore).toBe('database')
  })

  it('allows the rate limit store to be overridden via env', () => {
    const memoryEnv = createEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://db',
      NEXTAUTH_SECRET: 'production-secret',
      RATE_LIMIT_STORE: 'memory',
    })

    expect(memoryEnv.rateLimitStore).toBe('memory')
  })
})
