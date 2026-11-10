import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db/prisma'
import { getLeadsPageData } from '@/lib/crm/queries/leads'
import { getSettingsOverviewData } from '@/lib/crm/queries/settings'

vi.mock('@/lib/db/prisma', () => ({
  db: {
    lead: { findMany: vi.fn() },
    company: { count: vi.fn() },
    contact: { count: vi.fn() },
    deal: { count: vi.fn() },
    task: { count: vi.fn() },
    pipeline: { findMany: vi.fn() },
    tag: { findMany: vi.fn() },
  },
}))

vi.mock('@/lib/auth/rbac', () => ({
  requirePermission: vi.fn().mockResolvedValue(undefined),
}))

// The mocked payloads only carry the fields the query mappers read; cast
// away the full Prisma payload types for brevity.
function mockResolved(fn: (...args: never[]) => Promise<unknown>, value: unknown) {
  vi.mocked(fn).mockResolvedValue(value as never)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getLeadsPageData', () => {
  it('maps lead rows with fallbacks for missing relations', async () => {
    mockResolved(db.lead.findMany, [
      {
        id: 'lead-1',
        title: 'Yeni Proje',
        company: null,
        contact: null,
        owner: null,
        stage: { key: 'discovery', name: 'Gorusme' },
        source: 'WEBSITE',
        temperature: 'HOT',
        status: 'OPEN',
        estimatedValue: null,
        ownerId: null,
        email: null,
        phone: null,
      },
      {
        id: 'lead-2',
        title: 'Ikinci Lead',
        company: { name: 'Aydin Hafriyat' },
        contact: { firstName: 'Caner', lastName: 'Aydin' },
        owner: { firstName: 'Ada', lastName: 'Kan' },
        stage: { key: 'proposal', name: 'Teklif' },
        source: 'PHONE',
        temperature: 'COLD',
        status: 'QUALIFIED',
        estimatedValue: { toNumber: () => 12500 },
        ownerId: 'user-1',
        email: 'caner@ornek.com',
        phone: '+90 555 000 00 00',
      },
    ])

    const rows = await getLeadsPageData()

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      id: 'lead-1',
      company: '-',
      contact: '-',
      owner: 'common.unassigned',
      estimatedValue: 0,
      email: '-',
      phone: '-',
      stage: 'Gorusme',
      stageKey: 'discovery',
    })
    expect(rows[1]).toMatchObject({
      id: 'lead-2',
      company: 'Aydin Hafriyat',
      contact: 'Caner Aydin',
      owner: 'Ada Kan',
      estimatedValue: 12500,
      email: 'caner@ornek.com',
      phone: '+90 555 000 00 00',
    })
  })
})

describe('getSettingsOverviewData', () => {
  it('aggregates counts, pipelines and tags', async () => {
    mockResolved(db.company.count, 3)
    mockResolved(db.contact.count, 5)
    mockResolved(db.deal.count, 7)
    mockResolved(db.task.count, 9)
    mockResolved(db.pipeline.findMany, [
      {
        id: 'pipeline-1',
        name: 'Satis',
        stages: [
          {
            id: 'stage-1',
            key: 'new-opportunity',
            name: 'Yeni Firsat',
            position: 0,
            probability: 10,
            isClosed: false,
            isWon: false,
          },
        ],
      },
    ])
    mockResolved(db.tag.findMany, [
      {
        id: 'tag-1',
        name: 'Onemli',
        color: '#2563eb',
        _count: { companies: 1, contacts: 2, deals: 3 },
      },
    ])

    const data = await getSettingsOverviewData()

    expect(data.counts).toEqual({ companies: 3, contacts: 5, deals: 7, tasks: 9 })
    expect(data.pipelines[0]?.stages[0]?.key).toBe('new-opportunity')
    expect(data.tags[0]?._count.deals).toBe(3)
  })
})
