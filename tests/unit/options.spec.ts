import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db/prisma'
import { getAssignableUsers, getQuickCreateOptions } from '@/lib/crm/queries/options'

vi.mock('@/lib/db/prisma', () => ({
  db: {
    user: { findMany: vi.fn() },
    company: { findMany: vi.fn() },
    contact: { findMany: vi.fn() },
    lead: { findMany: vi.fn() },
    pipeline: { findMany: vi.fn() },
  },
}))

vi.mock('@/lib/auth/rbac', () => ({
  requirePermission: vi.fn().mockResolvedValue(undefined),
  requireAuthenticatedUser: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getQuickCreateOptions', () => {
  it('maps users, companies, contacts, leads and pipelines', async () => {
    vi.mocked(db.user.findMany).mockResolvedValue([
      { id: 'user-1', firstName: 'Ada', lastName: 'Kan' },
    ] as never)
    vi.mocked(db.company.findMany).mockResolvedValue([
      { id: 'company-1', name: 'Aydin Hafriyat' },
    ] as never)
    vi.mocked(db.contact.findMany).mockResolvedValue([
      { id: 'contact-1', firstName: 'Caner', lastName: 'Aydin' },
    ] as never)
    vi.mocked(db.lead.findMany).mockResolvedValue([
      { id: 'lead-1', title: 'Yeni Proje' },
    ] as never)
    vi.mocked(db.pipeline.findMany).mockResolvedValue([
      {
        id: 'pipe-1',
        name: 'Satis',
        stages: [{ id: 'stage-1', key: 'discovery', name: 'Gorusme' }],
      },
    ] as never)

    const options = await getQuickCreateOptions()

    expect(options.users).toEqual([{ id: 'user-1', name: 'Ada Kan' }])
    expect(options.companies).toEqual([{ id: 'company-1', name: 'Aydin Hafriyat' }])
    expect(options.contacts).toEqual([{ id: 'contact-1', name: 'Caner Aydin' }])
    expect(options.leads).toEqual([{ id: 'lead-1', title: 'Yeni Proje' }])
    expect(options.pipelines).toEqual([
      {
        id: 'pipe-1',
        name: 'Satis',
        stages: [{ id: 'stage-1', key: 'discovery', name: 'Gorusme' }],
      },
    ])
  })
})

describe('getAssignableUsers', () => {
  it('maps active and invited users to id/name pairs', async () => {
    vi.mocked(db.user.findMany).mockResolvedValue([
      { id: 'user-1', firstName: 'Ada', lastName: 'Kan' },
      { id: 'user-2', firstName: 'Caner', lastName: 'Aydin' },
    ] as never)

    const users = await getAssignableUsers()

    expect(users).toEqual([
      { id: 'user-1', name: 'Ada Kan' },
      { id: 'user-2', name: 'Caner Aydin' },
    ])
    expect(vi.mocked(db.user.findMany).mock.calls[0][0]).toMatchObject({
      where: { archivedAt: null, status: { in: ['ACTIVE', 'INVITED'] } },
    })
  })
})
