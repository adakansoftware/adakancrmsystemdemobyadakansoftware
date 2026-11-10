import { describe, expect, it, vi } from 'vitest'
import { SESSION_TTL_MS, SESSION_TTL_SECONDS } from '@/lib/auth/constants'
import {
  getLoginRateLimitKeys,
  LOGIN_RATE_LIMIT_ERROR_MESSAGE,
  resolveClientIp,
} from '@/lib/auth/login-rate-limit'
import { resolveClientIpFromHeaders } from '@/lib/request/request-metadata'

// request-metadata reads the lazy env proxy, which requires DATABASE_URL.
vi.stubEnv('DATABASE_URL', 'postgresql://test')

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

  it('falls back to x-real-ip behind a trusted proxy', () => {
    const realIp = resolveClientIpFromHeaders(
      {
        get(name: string) {
          if (name === 'x-real-ip') return '203.0.113.9'
          return null
        },
      },
      true,
    )

    expect(realIp).toBe('203.0.113.9')
  })

  it('trims whitespace from the resolved IP', () => {
    const realIp = resolveClientIpFromHeaders(
      {
        get(name: string) {
          if (name === 'x-real-ip') return '  203.0.113.20  '
          return null
        },
      },
      true,
    )

    expect(realIp).toBe('203.0.113.20')
  })
})

describe('request metadata', () => {
  it('resolves IP and user agent from a header store', async () => {
    const { getRequestMetadata } = await import('@/lib/request/request-metadata')

    const metadata = await getRequestMetadata({
      get(name: string) {
        if (name === 'x-client-ip') return '198.51.100.7'
        if (name === 'user-agent') return '  vitest/1.0  '
        return null
      },
    })

    expect(metadata).toEqual({ ipAddress: '198.51.100.7', userAgent: 'vitest/1.0' })
  })

  it('returns nulls when no relevant headers exist', async () => {
    const { getRequestMetadata } = await import('@/lib/request/request-metadata')

    const metadata = await getRequestMetadata({ get: () => null })

    expect(metadata).toEqual({ ipAddress: null, userAgent: null })
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
