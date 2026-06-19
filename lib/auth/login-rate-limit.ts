import { headers } from 'next/headers'
import {
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  LOGIN_RATE_LIMIT_WINDOW_MS,
} from '@/lib/auth/constants'
import { resolveClientIpFromHeaders } from '@/lib/request/request-metadata'
import { checkRateLimit, clearRateLimit } from '@/lib/security/rate-limit'

export const LOGIN_RATE_LIMIT_ERROR_MESSAGE =
  'Cok fazla giris denemesi yapildi. Lutfen daha sonra tekrar deneyin.'

type HeaderStoreLike = {
  get(name: string): string | null
}

export { resolveClientIpFromHeaders as resolveClientIp }

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
  const clientIp =
    resolveClientIpFromHeaders(resolvedHeaders, trustProxyHeaders) ?? 'unknown'

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
    const result = await checkRateLimit(
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

export async function clearLoginRateLimit(keys: string[]) {
  for (const key of keys) {
    await clearRateLimit(key)
  }
}
