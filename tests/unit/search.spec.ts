import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db/prisma'
import { searchCrmRecords } from '@/lib/crm/search'

vi.mock('@/lib/db/prisma', () => ({
  db: {
    company: { findMany: vi.fn() },
    contact: { findMany: vi.fn() },
    lead: { findMany: vi.fn() },
    deal: { findMany: vi.fn() },
    task: { findMany: vi.fn() },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.company.findMany).mockResolvedValue([] as never)
  vi.mocked(db.contact.findMany).mockResolvedValue([] as never)
  vi.mocked(db.lead.findMany).mockResolvedValue([] as never)
  vi.mocked(db.deal.findMany).mockResolvedValue([] as never)
  vi.mocked(db.task.findMany).mockResolvedValue([] as never)
})

describe('searchCrmRecords', () => {
  it('returns nothing for queries shorter than two characters', async () => {
    expect(await searchCrmRecords('a')).toEqual([])
    expect(await searchCrmRecords('   ')).toEqual([])
    expect(db.company.findMany).not.toHaveBeenCalled()
  })

  it('skips disabled entity kinds', async () => {
    await searchCrmRecords('aydin', {
      company: false,
      contact: false,
      lead: false,
      deal: false,
      task: false,
    })

    expect(db.company.findMany).not.toHaveBeenCalled()
    expect(db.contact.findMany).not.toHaveBeenCalled()
    expect(db.lead.findMany).not.toHaveBeenCalled()
    expect(db.deal.findMany).not.toHaveBeenCalled()
    expect(db.task.findMany).not.toHaveBeenCalled()
  })

  it('searches only the enabled kinds', async () => {
    await searchCrmRecords('aydin', { company: true, contact: false, lead: false, deal: false, task: false })

    expect(db.company.findMany).toHaveBeenCalledTimes(1)
    expect(db.contact.findMany).not.toHaveBeenCalled()
  })

  it('maps every entity kind with its route', async () => {
    vi.mocked(db.company.findMany).mockResolvedValue([
      { id: 'company-1', name: 'Aydin Hafriyat', city: 'Istanbul', industry: 'Insaat' },
    ] as never)
    vi.mocked(db.contact.findMany).mockResolvedValue([
      { id: 'contact-1', firstName: 'Caner', lastName: 'Aydin', email: null, company: null },
    ] as never)
    vi.mocked(db.lead.findMany).mockResolvedValue([
      { id: 'lead-1', title: 'Yeni Proje', status: 'OPEN', company: null },
    ] as never)
    vi.mocked(db.deal.findMany).mockResolvedValue([
      {
        id: 'deal-1',
        title: 'Anlasma',
        company: { name: 'Beta A.S.' },
        amount: { toString: () => '12500' },
        currency: 'TRY',
      },
    ] as never)
    vi.mocked(db.task.findMany).mockResolvedValue([
      { id: 'task-1', title: 'Teklif gonder', status: 'DONE', assignee: null },
    ] as never)

    const results = await searchCrmRecords('test')

    expect(results).toEqual([
      {
        id: 'company-1',
        title: 'Aydin Hafriyat',
        subtitle: 'Insaat / Istanbul',
        href: '/firmalar',
        kind: 'company',
      },
      {
        id: 'contact-1',
        title: 'Caner Aydin',
        subtitle: 'search.contactRecord',
        href: '/musteriler',
        kind: 'contact',
      },
      {
        id: 'lead-1',
        title: 'Yeni Proje',
        subtitle: 'OPEN',
        href: '/leads',
        kind: 'lead',
      },
      {
        id: 'deal-1',
        title: 'Anlasma',
        subtitle: 'Beta A.S. / TRY 12500',
        href: '/anlasmalar',
        kind: 'deal',
      },
      {
        id: 'task-1',
        title: 'Teklif gonder',
        subtitle: 'DONE',
        href: '/gorevler',
        kind: 'task',
      },
    ])
  })

  it('caps the merged result list at 12 items', async () => {
    vi.mocked(db.company.findMany).mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({ id: `company-${i}`, name: `Firma ${i}` })) as never,
    )
    vi.mocked(db.contact.findMany).mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({ id: `contact-${i}`, firstName: `Ad ${i}` })) as never,
    )
    vi.mocked(db.task.findMany).mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({ id: `task-${i}`, title: `Gorev ${i}` })) as never,
    )

    const results = await searchCrmRecords('test')

    expect(results).toHaveLength(12)
  })
})
