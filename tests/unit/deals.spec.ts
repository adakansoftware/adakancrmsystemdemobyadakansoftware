import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db/prisma'
import { getDealDetailPageData, getDealsPageData } from '@/lib/crm/queries/deals'

vi.mock('@/lib/db/prisma', () => ({
  db: {
    deal: {
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

describe('getDealsPageData', () => {
  it('maps deal rows with stage and pipeline data', async () => {
    vi.mocked(db.deal.findMany).mockResolvedValue(
      [
        {
          id: 'deal-1',
          title: 'Yeni Anlasma',
          company: { name: 'Aydin Hafriyat' },
          contact: { firstName: 'Caner', lastName: 'Aydin' },
          owner: { firstName: 'Ada', lastName: 'Kan' },
          amount: 12500,
          currency: 'TRY',
          status: 'OPEN',
          probability: 60,
          expectedCloseAt: new Date('2026-12-01T00:00:00.000Z'),
          ownerId: 'user-1',
          stageId: 'stage-1',
          stage: { name: 'Gorusme', key: 'discovery' },
          pipelineId: 'pipe-1',
          pipeline: {
            stages: [
              { id: 'stage-1', key: 'discovery', name: 'Gorusme', isClosed: false, isWon: false },
              { id: 'stage-2', key: 'won', name: 'Kazanildi', isClosed: true, isWon: true },
            ],
          },
        },
        {
          id: 'deal-2',
          title: 'Ikinci Anlasma',
          company: null,
          contact: null,
          owner: null,
          amount: 5000,
          currency: 'USD',
          status: 'WON',
          probability: 100,
          expectedCloseAt: null,
          ownerId: null,
          stageId: 'stage-2',
          stage: { name: 'Kazanildi', key: 'won' },
          pipelineId: 'pipe-1',
          pipeline: { stages: [] },
        },
      ] as never,
    )

    const rows = await getDealsPageData()

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      id: 'deal-1',
      company: 'Aydin Hafriyat',
      contact: 'Caner Aydin',
      owner: 'Ada Kan',
      ownerInitials: 'AK',
      amount: 12500,
      stage: 'Gorusme',
      stageKey: 'discovery',
    })
    expect(rows[0]?.availableStages).toHaveLength(2)
    expect(rows[1]).toMatchObject({
      company: '-',
      contact: '-',
      owner: 'common.unassigned',
      ownerInitials: '--',
    })
  })
})

describe('getDealDetailPageData', () => {
  it('returns null when the deal is missing', async () => {
    vi.mocked(db.deal.findFirst).mockResolvedValue(null)

    expect(await getDealDetailPageData('missing')).toBeNull()
  })

  it('maps the deal detail view model', async () => {
    vi.mocked(db.deal.findFirst).mockResolvedValue({
      id: 'deal-1',
      title: 'Yeni Anlasma',
      description: null,
      amount: 12500,
      currency: 'TRY',
      status: 'OPEN',
      probability: 60,
      expectedCloseAt: null,
      pipelineId: 'pipe-1',
      stageId: 'stage-1',
      ownerId: null,
      contactId: null,
      companyId: 'company-1',
      createdAt: new Date('2026-10-01T00:00:00.000Z'),
      updatedAt: new Date('2026-11-01T00:00:00.000Z'),
      owner: { firstName: 'Ada', lastName: 'Kan', email: 'ada@ornek.com' },
      company: { id: 'company-1', name: 'Aydin Hafriyat' },
      contact: { id: 'contact-1', firstName: 'Caner', lastName: 'Aydin', email: null },
      stage: { id: 'stage-1', key: 'discovery', name: 'Gorusme', isClosed: false, isWon: false },
      pipeline: {
        id: 'pipe-1',
        name: 'Satis',
        stages: [
          { id: 'stage-1', key: 'discovery', name: 'Gorusme', isClosed: false, isWon: false },
        ],
      },
      activities: [
        {
          id: 'activity-1',
          type: 'CALL',
          subject: 'Arandi',
          description: null,
          occurredAt: new Date('2026-11-01T00:00:00.000Z'),
          actor: null,
        },
      ],
      tasks: [
        {
          id: 'task-1',
          title: 'Teklif gonder',
          status: 'TODO',
          priority: 'HIGH',
          dueAt: null,
          assignee: null,
        },
      ],
      notes: [
        {
          id: 'note-1',
          title: 'Not',
          body: 'Govde',
          isPinned: false,
          createdAt: new Date('2026-11-01T00:00:00.000Z'),
          author: null,
        },
      ],
      stageHistory: [
        {
          id: 'hist-1',
          movedAt: new Date('2026-10-02T00:00:00.000Z'),
          note: null,
          fromStage: null,
          toStage: { key: 'discovery', name: 'Gorusme' },
          actor: { firstName: 'Ada', lastName: 'Kan' },
        },
      ],
    } as never)

    const deal = await getDealDetailPageData('deal-1')

    expect(deal).not.toBeNull()
    expect(deal).toMatchObject({
      id: 'deal-1',
      description: '',
      amount: 12500,
      owner: { name: 'Ada Kan', email: 'ada@ornek.com' },
      contact: { id: 'contact-1', name: 'Caner Aydin', email: '-' },
    })
    expect(deal?.activities[0]).toMatchObject({
      id: 'activity-1',
      actorName: 'common.system',
    })
    expect(deal?.notes[0]).toMatchObject({ id: 'note-1', authorName: 'common.system' })
    expect(deal?.tasks[0]).toMatchObject({ id: 'task-1', assigneeName: 'common.unassigned' })
    expect(deal?.history[0]).toMatchObject({
      id: 'hist-1',
      fromStage: null,
      toStage: { key: 'discovery', name: 'Gorusme' },
      note: '',
      actorName: 'Ada Kan',
    })
  })
})
