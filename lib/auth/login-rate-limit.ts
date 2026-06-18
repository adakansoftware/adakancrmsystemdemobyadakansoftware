import { headers } from 'next/headers'
import {
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  LOGIN_RATE_LIMIT_WINDOW_MS,
} from '@/lib/auth/constants'
import { checkRateLimit, clearRateLimit } from '@/lib/security/rate-limit'

export const LOGIN_RATE_LIMIT_ERROR_MESSAGE =
  'Cok fazla giris denemesi yapildi. Lutfen daha sonra tekrar deneyin.'

type HeaderStoreLike = {
  get(name: string): string | null
}

type ClientIpOptions = {
  forwardedFor?: string | null
  realIp?: string | null
  trustProxyHeaders: boolean
}

export function resolveClientIp({
  forwardedFor,
  realIp,
  trustProxyHeaders,
}: ClientIpOptions) {
  if (trustProxyHeaders) {
    const forwardedIp = forwardedFor?.split(',')[0]?.trim()
    if (forwardedIp) {
      return forwardedIp
    }

    if (realIp?.trim()) {
      return realIp.trim()
    }
  }

  return 'unknown'
}

export function getLoginRateLimitKeys(email: string, clientIp: string) {
  const normalizedEmail = email.trim().toLowerCase()
  return [`login:${clientIp}`, `login:${clientIp}:${normalizedEmail}`]
}

export async function getRequestLoginRateLimitContext(
  email: string,
  trustProxyHeaders: boolean,
  headerStore?: HeaderStoreLike,
) {
  const resolvedHeaders = headerStore ?? (await headers())
  const clientIp = resolveClientIp({
    forwardedFor: resolvedHeaders.get('x-forwarded-for'),
    realIp: resolvedHeaders.get('x-real-ip'),
    trustProxyHeaders,
  })

  return {
    clientIp,
    keys: getLoginRateLimitKeys(email, clientIp),
  }
}

export async function assertLoginRateLimit(
  email: string,
  trustProxyHeaders: boolean,
  headerStore?: HeaderStoreLike,
) {
  const context = await getRequestLoginRateLimitContext(
    email,
    trustProxyHeaders,
    headerStore,
  )

  for (const key of context.keys) {
    const result = checkRateLimit(
      key,
      LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
      LOGIN_RATE_LIMIT_WINDOW_MS,
    )

    if (!result.allowed) {
      throw new Error(LOGIN_RATE_LIMIT_ERROR_MESSAGE)
    }
  }

  return context
}

export function clearLoginRateLimit(keys: string[]) {
  for (const key of keys) {
    clearRateLimit(key)
  }
}
