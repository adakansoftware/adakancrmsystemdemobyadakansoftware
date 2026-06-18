type RateLimitState = {
  count: number
  resetAt: number
}

declare global {
  var __crmRateLimitStore__: Map<string, RateLimitState> | undefined
}

const rateLimitStore = global.__crmRateLimitStore__ ?? new Map<string, RateLimitState>()

if (!global.__crmRateLimitStore__) {
  global.__crmRateLimitStore__ = rateLimitStore
}

// This in-memory limiter only protects a single Node.js instance.
// In serverless or multi-instance deployments, use a shared store such as Redis,
// Vercel KV, or another edge-compatible backend to enforce global limits.

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const current = rateLimitStore.get(key)

  if (!current || current.resetAt <= now) {
    const nextState = {
      count: 1,
      resetAt: now + windowMs,
    }
    rateLimitStore.set(key, nextState)
    return {
      allowed: true,
      remaining: Math.max(0, limit - nextState.count),
      resetAt: nextState.resetAt,
    }
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
    }
  }

  current.count += 1
  rateLimitStore.set(key, current)

  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  }
}

export function clearRateLimit(key: string) {
  rateLimitStore.delete(key)
}
