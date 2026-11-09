import { describe, expect, it } from 'vitest'
import { SESSION_TTL_MS, SESSION_TTL_SECONDS } from '@/lib/auth/constants'
import {
  getLoginRateLimitKeys,
  LOGIN_RATE_LIMIT_ERROR_MESSAGE,
  resolveClientIp,
} from '@/lib/auth/login-rate-limit'
import { resolveClientIpFromHeaders } from '@/lib/request/request-metadata'

describe('session TTL', () => {
  it('derives the second value from the millisecond value', () => {
    expect(SESSION_TTL_SECONDS).toBe(Math.floor(SESSION_TTL_MS / 1000))
  })
})

describe('client IP resolution', () => {
  it('uses the first forwarded IP behind a trusted proxy', () => {
    const trustedIp = resolveClientIp(
      {
        get(name: string) {
          if (name === 'x-forwarded-for') return '198.51.100.10, 10.0.0.1'
          return null
        },
      },
      true,
    )

    expect(trustedIp).toBe('198.51.100.10')
  })

  it('ignores proxy headers from untrusted sources', () => {
    const untrustedIp = resolveClientIp(
      {
        get(name: string) {
          if (name === 'x-forwarded-for') return '198.51.100.10'
          if (name === 'x-real-ip') return '203.0.113.8'
          return null
        },
      },
      false,
    )

    expect(untrustedIp).toBeNull()
  })

  it('reads the fallback client IP header', () => {
    const fallbackIp = resolveClientIpFromHeaders(
      {
        get(name: string) {
          if (name === 'x-client-ip') return '203.0.113.15'
          return null
        },
      },
      false,
    )

    expect(fallbackIp).toBe('203.0.113.15')
  })
})

describe('login rate limit keys', () => {
  it('builds IP and normalized email based keys', () => {
    const keys = getLoginRateLimitKeys('User@Example.com', '203.0.113.5')

    expect(keys[0]).toBe('login:203.0.113.5')
    expect(keys[1]).toBe('login:203.0.113.5:user@example.com')
    expect(LOGIN_RATE_LIMIT_ERROR_MESSAGE.length).toBeGreaterThan(10)
  })
})
