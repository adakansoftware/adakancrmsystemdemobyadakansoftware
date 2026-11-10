import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db/prisma'
import { getReportsPageData } from '@/lib/crm/queries/reports'

vi.mock('@/lib/db/prisma', () => ({
  db: {
    user: { findMany: vi.fn() },
    dealStageHistory: { findMany: vi.fn() },
    activity: { findMany: vi.fn() },
    deal: { findMany: vi.fn() },
    tag: { findMany: vi.fn() },
  },
}))

vi.mock('@/lib/auth/rbac', () => ({
  requirePermission: vi.fn().mockResolvedValue(undefined),
}))

const DAY_MS = 24 * 60 * 60 * 1000

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getReportsPageData', () => {
  it('derives sales, pipeline, activity and forecast figures', async () => {
    const now = new Date()

    vi.mocked(db.user.findMany).mockResolvedValue([
      {
        id: 'user-1',
        firstName: 'Ada',
        lastName: 'Kan',
        ownedDeals: [
          { status: 'WON', amount: 2000, wonAt: now },
          { status: 'OPEN', amount: 10000, wonAt: null },
          { status: 'LOST', amount: 5000, wonAt: null },
        ],
      },
    ] as never)

    vi.mocked(db.dealStageHistory.findMany).mockResolvedValue([
      {
        dealId: 'deal-1',
        movedAt: new Date(now.getTime() - 5 * DAY_MS),
        fromStageId: null,
        toStageId: 'stage-1',
        fromStage: null,
        toStage: { key: 'discovery', name: 'Gorusme' },
      },
      {
        dealId: 'deal-1',
        movedAt: new Date(now.getTime() - 3 * DAY_MS),
        fromStageId: 'stage-1',
        toStageId: 'stage-2',
        fromStage: { key: 'discovery', name: 'Gorusme' },
        toStage: { key: 'proposal', name: 'Teklif' },
      },
      {
        dealId: 'deal-2',
        movedAt: now,
        fromStageId: 'stage-2',
        toStageId: 'stage-3',
        fromStage: { key: 'proposal', name: 'Teklif' },
        toStage: { key: 'won', name: 'Kazanildi' },
      },
    ] as never)

    vi.mocked(db.activity.findMany).mockResolvedValue([
      {
        type: 'CALL',
        occurredAt: new Date(now.getTime() - 1 * DAY_MS),
        actor: { id: 'user-1', firstName: 'Ada', lastName: 'Kan' },
      },
      {
        type: 'EMAIL',
        occurredAt: new Date(now.getTime() - 10 * DAY_MS),
        actor: { id: 'user-1', firstName: 'Ada', lastName: 'Kan' },
      },
      {
        type: 'MEETING',
        occurredAt: new Date(now.getTime() - 20 * DAY_MS),
        actor: { id: 'user-1', firstName: 'Ada', lastName: 'Kan' },
      },
      {
        type: 'NOTE',
        occurredAt: now,
        actor: null,
      },
    ] as never)

    vi.mocked(db.deal.findMany).mockResolvedValue([
      {
        id: 'deal-1',
        title: 'Duragan anlasma',
        amount: 10000,
        probability: 50,
        createdAt: new Date(now.getTime() - 30 * DAY_MS),
        expectedCloseAt: null,
        status: 'OPEN',
        stage: { key: 'discovery', name: 'Gorusme' },
        tags: [{ name: 'onemli' }],
      },
      {
        id: 'deal-2',
        title: 'Kaybedilen',
        amount: 5000,
        probability: 0,
        createdAt: new Date(now.getTime() - 40 * DAY_MS),
        expectedCloseAt: null,
        status: 'LOST',
        stage: { key: 'lost', name: 'Kaybedildi' },
        tags: [],
      },
    ] as never)

    vi.mocked(db.tag.findMany).mockResolvedValue([
      {
        id: 'tag-1',
        name: 'onemli',
        color: '#ff0000',
        _count: { companies: 2, contacts: 3, deals: 4 },
      },
    ] as never)

    const data = await getReportsPageData()

    const sales = data.salesPerformance[0]
    expect(sales).toMatchObject({
      id: 'user-1',
      name: 'Ada Kan',
      totalDeals: 3,
      wonDeals: 1,
      winRate: 33,
      revenue: 2000,
    })
    expect(sales?.monthlyClosed).toHaveLength(6)

    // Only the same-deal transition (5d ago -> 3d ago) counts: 2 days on stage-1.
    expect(data.pipelineAnalysis).toEqual([
      { stageKey: 'discovery', stage: 'Gorusme', avgDays: 2, transitions: 1 },
    ])

    expect(data.activitySummary).toEqual([
      {
        name: 'Ada Kan',
        call: 1,
        email: 1,
        meeting: 1,
        thisWeek: 1,
        lastWeek: 1,
      },
    ])

    expect(data.weightedPipelineValue).toBe(5000)
    expect(data.forecastCoverage).toBe(0)
    expect(data.stalledDeals).toEqual([
      {
        id: 'deal-1',
        title: 'Duragan anlasma',
        stage: 'Gorusme',
        stageKey: 'discovery',
        amount: 10000,
        ageDays: 30,
        tags: ['onemli'],
      },
    ])

    expect(data.activityMix).toEqual([
      { type: 'CALL', value: 1 },
      { type: 'EMAIL', value: 1 },
      { type: 'MEETING', value: 1 },
    ])

    expect(data.tagPerformance).toEqual([
      {
        id: 'tag-1',
        name: 'onemli',
        color: '#ff0000',
        companyCount: 2,
        contactCount: 3,
        dealCount: 4,
      },
    ])
  })

  it('handles empty datasets without dividing by zero', async () => {
    vi.mocked(db.user.findMany).mockResolvedValue([] as never)
    vi.mocked(db.dealStageHistory.findMany).mockResolvedValue([] as never)
    vi.mocked(db.activity.findMany).mockResolvedValue([] as never)
    vi.mocked(db.deal.findMany).mockResolvedValue([] as never)
    vi.mocked(db.tag.findMany).mockResolvedValue([] as never)

    const data = await getReportsPageData()

    expect(data.salesPerformance).toEqual([])
    expect(data.pipelineAnalysis).toEqual([])
    expect(data.activitySummary).toEqual([])
    expect(data.weightedPipelineValue).toBe(0)
    expect(data.forecastCoverage).toBe(0)
    expect(data.stalledDeals).toEqual([])
    expect(data.monthlyClosedByUser).toHaveLength(6)
  })
})
