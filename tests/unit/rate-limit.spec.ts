import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '@/lib/db/generated/prisma/client'
import { db } from '@/lib/db/prisma'
import { env } from '@/lib/env'
import { checkRateLimit, clearRateLimit } from '@/lib/security/rate-limit'

vi.mock('@/lib/env', () => ({
  env: {
    rateLimitStore: 'memory',
    databaseConfigured: false,
  },
}))

vi.mock('@/lib/db/prisma', () => ({
  db: {
    $transaction: vi.fn(),
    rateLimitBucket: { deleteMany: vi.fn() },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(env).rateLimitStore = 'memory'
  vi.mocked(env).databaseConfigured = false
})

afterEach(async () => {
  await clearRateLimit('test:*')
})

describe('memory rate limit store', () => {
  it('allows requests up to the limit then blocks', async () => {
    const first = await checkRateLimit('test:a', 2, 60_000)
    expect(first).toMatchObject({ allowed: true, remaining: 1 })

    const second = await checkRateLimit('test:a', 2, 60_000)
    expect(second).toMatchObject({ allowed: true, remaining: 0 })

    const third = await checkRateLimit('test:a', 2, 60_000)
    expect(third).toMatchObject({ allowed: false, remaining: 0, resetAt: second.resetAt })
  })

  it('starts a fresh window after expiry', async () => {
    await checkRateLimit('test:b', 1, 0)
    // Window of 0 ms is already expired on the next tick.

    const afterWindow = await checkRateLimit('test:b', 1, 0)
    expect(afterWindow.allowed).toBe(true)
  })

  it('clearing a key resets the counter', async () => {
    await checkRateLimit('test:c', 1, 60_000)
    expect((await checkRateLimit('test:c', 1, 60_000)).allowed).toBe(false)

    await clearRateLimit('test:c')
    expect((await checkRateLimit('test:c', 1, 60_000)).allowed).toBe(true)
  })
})

describe('database rate limit store', () => {
  function txMock(overrides: {
    findUnique?: unknown
    upsert?: unknown
    update?: unknown
  }) {
    return {
      rateLimitBucket: {
        findUnique: vi.fn().mockResolvedValue(overrides.findUnique ?? null),
        upsert: vi.fn().mockResolvedValue(
          overrides.upsert ?? {
            count: 1,
            resetAt: new Date(Date.now() + 60_000),
          },
        ),
        update: vi.fn().mockResolvedValue(
          overrides.update ?? {
            count: 2,
            resetAt: new Date(Date.now() + 60_000),
          },
        ),
      },
    }
  }

  beforeEach(() => {
    vi.mocked(env).rateLimitStore = 'database'
    vi.mocked(env).databaseConfigured = true
  })

  function runTransactionWith(tx: unknown) {
    vi.mocked(db.$transaction).mockImplementation(
      (async (callback: unknown) =>
        (callback as (t: unknown) => unknown)(tx)) as never,
    )
  }

  it('upserts a new bucket when none exists', async () => {
    const tx = txMock({ upsert: { count: 1, resetAt: new Date(Date.now() + 60_000) } })
    runTransactionWith(tx)

    const result = await checkRateLimit('test:db-new', 3, 60_000)

    expect(result).toMatchObject({ allowed: true, remaining: 2 })
    expect(tx.rateLimitBucket.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { key: 'test:db-new' } }),
    )
  })

  it('blocks once the stored count reaches the limit', async () => {
    const tx = txMock({
      findUnique: { count: 3, resetAt: new Date(Date.now() + 60_000) },
    })
    runTransactionWith(tx)

    const result = await checkRateLimit('test:db-full', 3, 60_000)

    expect(result).toMatchObject({ allowed: false, remaining: 0 })
    expect(tx.rateLimitBucket.update).not.toHaveBeenCalled()
  })

  it('increments an existing bucket below the limit', async () => {
    const tx = txMock({
      findUnique: { count: 1, resetAt: new Date(Date.now() + 60_000) },
      update: { count: 2, resetAt: new Date(Date.now() + 60_000) },
    })
    runTransactionWith(tx)

    const result = await checkRateLimit('test:db-inc', 3, 60_000)

    expect(result).toMatchObject({ allowed: true, remaining: 1 })
    expect(tx.rateLimitBucket.update).toHaveBeenCalledWith({
      where: { key: 'test:db-inc' },
      data: { count: { increment: 1 } },
    })
  })

  it('retries write conflicts (P2034) before giving up', async () => {
    const tx = txMock({})
    const conflict = new Prisma.PrismaClientKnownRequestError('write conflict', {
      code: 'P2034',
      clientVersion: 'test',
    })

    let calls = 0
    vi.mocked(db.$transaction).mockImplementation(
      (async (callback: unknown) => {
        calls += 1
        if (calls === 1) {
          throw conflict
        }
        return (callback as (t: unknown) => unknown)(tx)
      }) as never,
    )

    const result = await checkRateLimit('test:db-retry', 3, 60_000)

    expect(result).toMatchObject({ allowed: true })
    expect(calls).toBe(2)
  })

  it('deletes buckets on clear', async () => {
    await clearRateLimit('test:db-clear')

    expect(db.rateLimitBucket.deleteMany).toHaveBeenCalledWith({
      where: { key: 'test:db-clear' },
    })
  })
})

describe('store failure fallback', () => {
  it('fails open to the memory store when the database check throws', async () => {
    vi.mocked(env).rateLimitStore = 'database'
    vi.mocked(env).databaseConfigured = true
    vi.mocked(db.$transaction).mockRejectedValue(new Error('db down'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await checkRateLimit('test:fallback', 5, 60_000)

    expect(result).toMatchObject({ allowed: true, remaining: 4 })
    expect(consoleError).toHaveBeenCalled()

    consoleError.mockRestore()
  })

  it('falls back to memory when the database clear throws', async () => {
    vi.mocked(env).rateLimitStore = 'database'
    vi.mocked(env).databaseConfigured = true
    vi.mocked(db.rateLimitBucket.deleteMany).mockRejectedValue(new Error('db down'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(clearRateLimit('test:fallback-clear')).resolves.toBeUndefined()

    consoleError.mockRestore()
  })
})
