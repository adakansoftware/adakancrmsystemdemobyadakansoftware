import { Prisma } from '@prisma/client'
import { db } from '@/lib/db/prisma'
import { env } from '@/lib/env'

type RateLimitState = {
  count: number
  resetAt: number
}

type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

type RateLimitStore = {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>
  clear(key: string): Promise<void>
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

const memoryRateLimitStore: RateLimitStore = {
  async check(key: string, limit: number, windowMs: number) {
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
  },
  async clear(key: string) {
    rateLimitStore.delete(key)
  },
}

async function withSerializableRetry<T>(callback: () => Promise<T>, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await callback()
    } catch (error) {
      const isRetryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'

      if (!isRetryable || attempt === retries) {
        throw error
      }
    }
  }

  throw new Error('Rate limit transaction could not be completed')
}

const databaseRateLimitStore: RateLimitStore = {
  async check(key: string, limit: number, windowMs: number) {
    return withSerializableRetry(async () => {
      const now = new Date()
      const nextResetAt = new Date(now.getTime() + windowMs)

      return db.$transaction(
        async (tx) => {
          const current = await tx.rateLimitBucket.findUnique({
            where: { key },
          })

          if (!current || current.resetAt <= now) {
            const nextState = await tx.rateLimitBucket.upsert({
              where: { key },
              create: {
                key,
                count: 1,
                resetAt: nextResetAt,
              },
              update: {
                count: 1,
                resetAt: nextResetAt,
              },
            })

            return {
              allowed: true,
              remaining: Math.max(0, limit - nextState.count),
              resetAt: nextState.resetAt.getTime(),
            }
          }

          if (current.count >= limit) {
            return {
              allowed: false,
              remaining: 0,
              resetAt: current.resetAt.getTime(),
            }
          }

          const updated = await tx.rateLimitBucket.update({
            where: { key },
            data: {
              count: {
                increment: 1,
              },
            },
          })

          return {
            allowed: true,
            remaining: Math.max(0, limit - updated.count),
            resetAt: updated.resetAt.getTime(),
          }
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      )
    })
  },
  async clear(key: string) {
    await db.rateLimitBucket.deleteMany({
      where: { key },
    })
  },
}

function getActiveRateLimitStore() {
  if (env.rateLimitStore === 'memory' || !env.databaseConfigured) {
    return memoryRateLimitStore
  }

  return databaseRateLimitStore
}

export async function checkRateLimit(key: string, limit: number, windowMs: number) {
  try {
    return await getActiveRateLimitStore().check(key, limit, windowMs)
  } catch {
    return memoryRateLimitStore.check(key, limit, windowMs)
  }
}

export async function clearRateLimit(key: string) {
  try {
    await getActiveRateLimitStore().clear(key)
  } catch {
    await memoryRateLimitStore.clear(key)
  }
}
