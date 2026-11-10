import { beforeEach, describe, expect, it, vi } from 'vitest'
import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth/session'
import {
  getRoleSlugs,
  hasPermission,
  requireAuthenticatedUser,
  requirePermission,
} from '@/lib/auth/rbac'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('REDIRECT_TO_LOGIN')
  }),
}))

vi.mock('@/lib/auth/session', () => ({
  getCurrentSession: vi.fn(),
}))

function sessionWithRoles(roleSlugs: string[]) {
  return {
    id: 'jwt:user-1',
    userId: 'user-1',
    expiresAt: new Date(),
    user: {
      id: 'user-1',
      email: 'ada@ornek.com',
      firstName: 'Ada',
      lastName: 'Kan',
      roles: roleSlugs.map((slug) => ({ role: { slug } })),
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getRoleSlugs', () => {
  it('maps session roles to slugs', () => {
    expect(getRoleSlugs(sessionWithRoles(['owner', 'staff']))).toEqual(['owner', 'staff'])
  })

  it('returns an empty array without a session', () => {
    expect(getRoleSlugs(null)).toEqual([])
  })
})

describe('hasPermission', () => {
  it('grants owner every permission', () => {
    expect(hasPermission(['owner'], 'users:manage')).toBe(true)
    expect(hasPermission(['owner'], 'companies:delete')).toBe(true)
  })

  it('follows the role matrix', () => {
    expect(hasPermission(['manager'], 'companies:update')).toBe(true)
    expect(hasPermission(['manager'], 'companies:delete')).toBe(false)
    expect(hasPermission(['staff'], 'deals:create')).toBe(true)
    expect(hasPermission(['staff'], 'tags:manage')).toBe(false)
    expect(hasPermission(['readonly'], 'leads:read')).toBe(true)
    expect(hasPermission(['readonly'], 'leads:create')).toBe(false)
  })

  it('grants permission when any role has it', () => {
    expect(hasPermission(['readonly', 'manager'], 'tags:manage')).toBe(true)
  })

  it('denies unknown roles', () => {
    expect(hasPermission(['ghost' as never], 'leads:read')).toBe(false)
  })
})

describe('requirePermission', () => {
  it('redirects to login without a session', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(null)

    await expect(requirePermission('leads:read')).rejects.toThrow('REDIRECT_TO_LOGIN')
    expect(redirect).toHaveBeenCalledWith('/login')
  })

  it('throws when the permission is missing', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(sessionWithRoles(['readonly']))

    await expect(requirePermission('leads:create')).rejects.toThrow(
      'Forbidden: missing permission leads:create',
    )
  })

  it('returns the session when allowed', async () => {
    const session = sessionWithRoles(['manager'])
    vi.mocked(getCurrentSession).mockResolvedValue(session)

    await expect(requirePermission('leads:create')).resolves.toBe(session)
  })
})

describe('requireAuthenticatedUser', () => {
  it('redirects to login without a session', async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(null)

    await expect(requireAuthenticatedUser()).rejects.toThrow('REDIRECT_TO_LOGIN')
  })

  it('returns the session for any authenticated user', async () => {
    const session = sessionWithRoles(['readonly'])
    vi.mocked(getCurrentSession).mockResolvedValue(session)

    await expect(requireAuthenticatedUser()).resolves.toBe(session)
  })
})
