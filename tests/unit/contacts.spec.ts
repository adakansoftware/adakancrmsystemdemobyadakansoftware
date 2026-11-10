import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db/prisma'
import {
  getContactDetailPageData,
  getContactsManagementPageData,
} from '@/lib/crm/queries/contacts'

vi.mock('@/lib/db/prisma', () => ({
  db: {
    contact: {
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

describe('getContactsManagementPageData', () => {
  it('maps contact rows with company and activity fallbacks', async () => {
    vi.mocked(db.contact.findMany).mockResolvedValue(
      [
        {
          id: 'contact-1',
          companyId: 'company-1',
          ownerId: 'user-1',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          firstName: 'Caner',
          lastName: 'Aydin',
          jobTitle: 'Mudur',
          email: 'caner@ornek.com',
          phone: '+90 555 000 00 00',
          mobilePhone: '+90 555 123 45 67',
          company: { name: 'Aydin Hafriyat', city: 'Istanbul', industry: 'Insaat' },
          owner: { firstName: 'Ada', lastName: 'Kan' },
          activities: [
            {
              id: 'activity-1',
              type: 'CALL',
              subject: 'Arandi',
              description: null,
              occurredAt: new Date('2026-11-01T00:00:00.000Z'),
              actor: { firstName: 'Ada', lastName: 'Kan' },
            },
          ],
          deals: [
            { amount: 10000, status: 'OPEN' },
            { amount: 4000, status: 'LOST' },
          ],
          notes: [],
        },
        {
          id: 'contact-2',
          companyId: null,
          ownerId: null,
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
          firstName: 'Deniz',
          lastName: 'Yilmaz',
          jobTitle: null,
          email: null,
          phone: null,
          mobilePhone: null,
          company: null,
          owner: null,
          activities: [],
          deals: [],
          notes: [],
        },
      ] as never,
    )

    const rows = await getContactsManagementPageData()

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      id: 'contact-1',
      name: 'Caner Aydin',
      company: 'Aydin Hafriyat',
      city: 'Istanbul',
      industry: 'Insaat',
      phone: '+90 555 123 45 67',
      owner: 'Ada Kan',
      lastActivityAt: new Date('2026-11-01T00:00:00.000Z'),
      lastActivitySubject: 'Arandi',
      relatedDealValue: 10000,
    })
    expect(rows[1]).toMatchObject({
      company: '-',
      email: '-',
      phone: '-',
      owner: 'common.unassigned',
      lastActivityAt: null,
      lastActivitySubject: 'Henuz aktivite yok',
      relatedDealValue: 0,
    })
  })
})

describe('getContactDetailPageData', () => {
  it('returns null when the contact is missing', async () => {
    vi.mocked(db.contact.findFirst).mockResolvedValue(null)

    expect(await getContactDetailPageData('missing')).toBeNull()
  })

  it('maps the contact detail view model', async () => {
    vi.mocked(db.contact.findFirst).mockResolvedValue({
      id: 'contact-1',
      companyId: 'company-1',
      ownerId: null,
      firstName: 'Caner',
      lastName: 'Aydin',
      email: 'caner@ornek.com',
      phone: '+90 555 000 00 00',
      mobilePhone: null,
      jobTitle: 'Mudur',
      linkedinUrl: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-11-01T00:00:00.000Z'),
      company: { id: 'company-1', name: 'Aydin Hafriyat', city: 'Istanbul', industry: 'Insaat' },
      owner: null,
      deals: [
        {
          id: 'deal-1',
          title: 'Anlasma',
          amount: 10000,
          currency: 'TRY',
          status: 'OPEN',
          stage: { key: 'discovery', name: 'Gorusme' },
          expectedCloseAt: null,
        },
      ],
      tasks: [
        { id: 'task-1', title: 'Teklif gonder', status: 'TODO', priority: 'HIGH', dueAt: null },
      ],
      activities: [],
      notes: [],
    } as never)

    const contact = await getContactDetailPageData('contact-1')

    expect(contact).not.toBeNull()
    expect(contact).toMatchObject({
      id: 'contact-1',
      name: 'Caner Aydin',
      phone: '+90 555 000 00 00',
      jobTitle: 'Mudur',
      linkedinUrl: '',
      owner: 'common.unassigned',
      company: { id: 'company-1', name: 'Aydin Hafriyat' },
    })
    expect(contact?.deals[0]).toMatchObject({
      amount: 10000,
      stage: 'Gorusme',
      stageKey: 'discovery',
    })
  })
})
