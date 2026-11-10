import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db/prisma'
import {
  getCompaniesManagementPageData,
  getCompanyDetailPageData,
} from '@/lib/crm/queries/companies'

vi.mock('@/lib/db/prisma', () => ({
  db: {
    company: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth/rbac', () => ({
  requirePermission: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getCompaniesManagementPageData', () => {
  it('maps company rows with deal aggregates and fallbacks', async () => {
    vi.mocked(db.company.findMany).mockResolvedValue(
      [
        {
          id: 'company-1',
          name: 'Aydin Hafriyat',
          legalName: 'Aydin Hafriyat A.S.',
          email: 'info@aydin.com',
          phone: '+90 555 111 22 33',
          website: 'https://aydin.com',
          industry: 'Insaat',
          status: 'ACTIVE',
          city: 'Istanbul',
          country: 'Turkiye',
          addressLine1: 'Merkez',
          employeeCount: 50,
          ownerId: 'user-1',
          owner: { firstName: 'Ada', lastName: 'Kan' },
          _count: { contacts: 4 },
          deals: [
            { amount: 10000, status: 'OPEN' },
            { amount: 2000, status: 'WON' },
          ],
          notes: [],
          activities: [],
        },
        {
          id: 'company-2',
          name: 'Beta',
          legalName: null,
          email: null,
          phone: null,
          website: null,
          industry: null,
          status: 'LEAD',
          city: null,
          country: null,
          addressLine1: null,
          employeeCount: null,
          ownerId: null,
          owner: null,
          _count: { contacts: 0 },
          deals: [],
          notes: [],
          activities: [],
        },
      ] as never,
    )

    const rows = await getCompaniesManagementPageData()

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      id: 'company-1',
      owner: 'Ada Kan',
      relatedCustomers: 4,
      activeDeals: 1,
      totalValue: 12000,
      sector: 'Insaat',
      city: 'Istanbul',
    })
    expect(rows[1]).toMatchObject({
      owner: 'common.unassigned',
      sector: '-',
      city: '-',
      totalValue: 0,
    })
  })
})

describe('getCompanyDetailPageData', () => {
  it('returns null when the company is missing', async () => {
    vi.mocked(db.company.findFirst).mockResolvedValue(null)

    expect(await getCompanyDetailPageData('missing')).toBeNull()
  })

  it('maps the company detail view model', async () => {
    vi.mocked(db.company.findFirst).mockResolvedValue({
      id: 'company-1',
      name: 'Aydin Hafriyat',
      legalName: null,
      email: null,
      phone: null,
      website: null,
      industry: 'Insaat',
      status: 'ACTIVE',
      city: 'Istanbul',
      country: 'Turkiye',
      addressLine1: null,
      employeeCount: 10,
      ownerId: 'user-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-11-01T00:00:00.000Z'),
      owner: { firstName: 'Ada', lastName: 'Kan' },
      contacts: [
        {
          id: 'contact-1',
          firstName: 'Caner',
          lastName: 'Aydin',
          email: 'caner@ornek.com',
          phone: '+90 555 000 00 00',
          mobilePhone: null,
          jobTitle: 'Mudur',
        },
        {
          id: 'contact-2',
          firstName: 'Deniz',
          lastName: 'Yilmaz',
          email: null,
          phone: null,
          mobilePhone: '+90 555 123 45 67',
          jobTitle: null,
        },
      ],
      deals: [
        {
          id: 'deal-1',
          title: 'Anlasma',
          amount: 10000,
          currency: 'TRY',
          status: 'OPEN',
          expectedCloseAt: null,
          contact: { firstName: 'Caner', lastName: 'Aydin' },
          stage: { key: 'discovery', name: 'Gorusme' },
        },
      ],
      tasks: [
        { id: 'task-1', title: 'Teklif gonder', status: 'TODO', priority: 'HIGH', dueAt: null },
      ],
      activities: [
        {
          id: 'activity-1',
          type: 'EMAIL',
          subject: 'Eposta gonderildi',
          description: null,
          occurredAt: new Date('2026-11-01T00:00:00.000Z'),
          actor: null,
        },
      ],
      notes: [
        {
          id: 'note-1',
          title: 'Not',
          body: 'Govde',
          isPinned: true,
          createdAt: new Date('2026-11-01T00:00:00.000Z'),
          author: null,
        },
      ],
    } as never)

    const company = await getCompanyDetailPageData('company-1')

    expect(company).not.toBeNull()
    expect(company?.ownerName).toBe('Ada Kan')
    expect(company?.contacts).toEqual([
      {
        id: 'contact-1',
        name: 'Caner Aydin',
        email: 'caner@ornek.com',
        phone: '+90 555 000 00 00',
        jobTitle: 'Mudur',
      },
      {
        id: 'contact-2',
        name: 'Deniz Yilmaz',
        email: '-',
        phone: '+90 555 123 45 67',
        jobTitle: '-',
      },
    ])
    expect(company?.deals[0]).toMatchObject({
      id: 'deal-1',
      amount: 10000,
      stage: 'Gorusme',
      stageKey: 'discovery',
      contact: 'Caner Aydin',
    })
    expect(company?.activities[0]).toMatchObject({
      actorName: 'common.system',
    })
    expect(company?.notes[0]).toMatchObject({ authorName: 'common.system' })
  })
})
