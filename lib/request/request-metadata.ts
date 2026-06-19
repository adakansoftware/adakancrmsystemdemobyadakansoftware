import { headers } from 'next/headers'
import { env } from '@/lib/env'

type HeaderStoreLike = {
  get(name: string): string | null
}

export type RequestMetadata = {
  ipAddress: string | null
  userAgent: string | null
}

export function resolveClientIpFromHeaders(
  headerStore: HeaderStoreLike,
  trustProxyHeaders = env.trustProxyHeaders,
) {
  if (trustProxyHeaders) {
    const forwardedIp = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim()
    if (forwardedIp) {
      return forwardedIp
    }

    const realIp = headerStore.get('x-real-ip')?.trim()
    if (realIp) {
      return realIp
    }
  }

  const remoteAddress = headerStore.get('x-client-ip')?.trim()
  return remoteAddress || null
}

export async function getRequestMetadata(
  headerStore?: HeaderStoreLike,
): Promise<RequestMetadata> {
  const resolvedHeaders = headerStore ?? (await headers())
  const userAgent = resolvedHeaders.get('user-agent')?.trim() || null

  return {
    ipAddress: resolveClientIpFromHeaders(resolvedHeaders),
    userAgent,
  }
}
