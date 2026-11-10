import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth } from '@/auth'
import { db } from '@/lib/db/prisma'
import { getCurrentSession, getCurrentUser } from '@/lib/auth/session'

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T): T => fn,
  }
})

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db/prisma', () => ({
  db: {
    user: { findUnique: vi.fn() },
  },
}))

const authSession = {
  user: {
    id: 'user-1',
    email: 'ada@ornek.com',
    firstName: 'Ada',
    lastName: null,
    sessionVersion: 3,
    roleSlugs: ['owner', 'manager'],
  },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getCurrentSession', () => {
  it('returns null when next-auth reports no user', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    expect(await getCurrentSession()).toBeNull()
    expect(db.user.findUnique).not.toHaveBeenCalled()
  })

  it('returns null when the user id or email is missing', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'ada@ornek.com' } } as never)

    expect(await getCurrentSession()).toBeNull()
  })

  it('returns null when the stored user is gone', async () => {
    vi.mocked(auth).mockResolvedValue(authSession as never)
    vi.mocked(db.user.findUnique).mockResolvedValue(null)

    expect(await getCurrentSession()).toBeNull()
  })

  it('rejects suspended and archived users', async () => {
    vi.mocked(auth).mockResolvedValue(authSession as never)

    vi.mocked(db.user.findUnique).mockResolvedValue({
      sessionVersion: 3,
      status: 'SUSPENDED',
    } as never)
    expect(await getCurrentSession()).toBeNull()

    vi.mocked(db.user.findUnique).mockResolvedValue({
      sessionVersion: 3,
      status: 'ARCHIVED',
    } as never)
    expect(await getCurrentSession()).toBeNull()
  })

  it('rejects stale tokens after a session version bump', async () => {
    vi.mocked(auth).mockResolvedValue(authSession as never)
    vi.mocked(db.user.findUnique).mockResolvedValue({
      sessionVersion: 4,
      status: 'ACTIVE',
    } as never)

    expect(await getCurrentSession()).toBeNull()
  })

  it('maps a valid JWT session to the legacy shape', async () => {
    vi.mocked(auth).mockResolvedValue(authSession as never)
    vi.mocked(db.user.findUnique).mockResolvedValue({
      sessionVersion: 3,
      status: 'ACTIVE',
    } as never)

    const session = await getCurrentSession()

    expect(session).not.toBeNull()
    expect(session).toMatchObject({
      id: 'jwt:user-1',
      userId: 'user-1',
    })
    expect(session?.user).toMatchObject({
      id: 'user-1',
      email: 'ada@ornek.com',
      firstName: 'Ada',
      lastName: '',
    })
    expect(session?.user.roles).toEqual([
      { role: { slug: 'owner' } },
      { role: { slug: 'manager' } },
    ])
  })
})

describe('getCurrentUser', () => {
  it('returns the session user', async () => {
    vi.mocked(auth).mockResolvedValue(authSession as never)
    vi.mocked(db.user.findUnique).mockResolvedValue({
      sessionVersion: 3,
      status: 'ACTIVE',
    } as never)

    expect((await getCurrentUser())?.email).toBe('ada@ornek.com')
  })

  it('returns null without a session', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    expect(await getCurrentUser()).toBeNull()
  })
})
