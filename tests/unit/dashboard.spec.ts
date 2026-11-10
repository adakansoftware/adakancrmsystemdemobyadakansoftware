import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db/prisma'
import { getDashboardData, getOpenCrmMetrics } from '@/lib/crm/queries/dashboard'

vi.mock('@/lib/db/prisma', () => ({
  db: {
    contact: { count: vi.fn() },
    company: { count: vi.fn() },
    lead: { count: vi.fn() },
    deal: { findMany: vi.fn() },
    task: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    activity: { findMany: vi.fn() },
    stage: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}))

vi.mock('@/lib/auth/rbac', () => ({
  requirePermission: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getOpenCrmMetrics', () => {
  it('aggregates open-state counters', async () => {
    vi.mocked(db.contact.count).mockResolvedValue(12)
    vi.mocked(db.company.count).mockResolvedValue(5)
    vi.mocked(db.lead.count).mockResolvedValue(7)
    vi.mocked(db.deal.findMany).mockResolvedValue([
      { amount: 10000 },
      { amount: 2500.5 },
    ] as never)
    vi.mocked(db.task.count).mockResolvedValue(3)

    const metrics = await getOpenCrmMetrics()

    expect(metrics).toEqual({
      totalContacts: 12,
      totalCompanies: 5,
      openLeads: 7,
      openDealCount: 2,
      openDealValue: 12500.5,
      pendingTasks: 3,
    })
  })
})

describe('getDashboardData', () => {
  it('computes metrics, stage values and staff performance', async () => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    vi.mocked(db.contact.count).mockResolvedValue(4)
    vi.mocked(db.company.count).mockResolvedValue(2)
    vi.mocked(db.lead.count).mockResolvedValue(1)
    vi.mocked(db.task.count).mockResolvedValue(2)
    vi.mocked(db.deal.findMany).mockResolvedValue([
      { amount: 10000 },
      { amount: 5000 },
    ] as never)
    vi.mocked(db.activity.findMany).mockResolvedValue([
      {
        id: 'activity-1',
        actor: { firstName: 'Ada', lastName: 'Kan' },
        subject: 'Arandi',
        description: null,
        type: 'CALL',
        occurredAt: new Date(),
      },
    ] as never)
    vi.mocked(db.stage.findMany).mockResolvedValue([
      {
        id: 'stage-1',
        name: 'Gorusme',
        key: 'discovery',
        deals: [
          { amount: 10000, status: 'OPEN' },
          { amount: 2000, status: 'WON' },
        ],
      },
    ] as never)
    vi.mocked(db.user.findMany).mockResolvedValue([
      {
        id: 'user-1',
        firstName: 'Ada',
        lastName: 'Kan',
        ownedDeals: [
          { status: 'OPEN', amount: 10000 },
          { status: 'WON', amount: 2000 },
        ],
        assignedTasks: [{ status: 'TODO' }, { status: 'DONE' }],
      },
    ] as never)
    vi.mocked(db.task.findMany).mockResolvedValue([
      {
        id: 'task-1',
        title: 'Teklif gonder',
        company: { name: 'Aydin Hafriyat' },
        contact: null,
        dueAt: new Date(),
        assignee: { firstName: 'Ada', lastName: 'Kan' },
        priority: 'HIGH',
      },
    ] as never)

    // The last findMany in the Promise.all is the deals metric query, so the
    // dashboard deal rows ride on the same mock: re-set it for the call.
    const dealRows = [
      {
        createdAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
        amount: 10000,
        status: 'OPEN',
        wonAt: null,
        closedAt: null,
      },
      {
        // Won this month, closed after 10 days.
        createdAt: new Date(monthStart.getTime() - 10 * 24 * 60 * 60 * 1000),
        amount: 2000,
        status: 'WON',
        wonAt: new Date(monthStart.getTime() + 5 * 24 * 60 * 60 * 1000),
        closedAt: new Date(monthStart.getTime() + 10 * 24 * 60 * 60 * 1000),
      },
      {
        createdAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
        amount: 5000,
        status: 'LOST',
        wonAt: null,
        closedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      },
    ]

    // deal.findMany serves both the open-metrics query (reads amount only,
    // fires first inside getOpenCrmMetrics) and the dashboard deal rows query.
    let dealFindManyCalls = 0
    vi.mocked(db.deal.findMany).mockImplementation((async () => {
      dealFindManyCalls += 1
      return dealFindManyCalls === 1 ? [{ amount: 10000 }, { amount: 5000 }] : dealRows
    }) as never)

    const data = await getDashboardData()

    expect(data.totalContacts).toBe(4)
    expect(data.openDeals).toBe(2)
    expect(data.totalOpenDealValue).toBe(15000)
    expect(data.wonThisMonthCount).toBe(1)
    expect(data.wonThisMonthValue).toBe(2000)
    expect(data.conversionRate).toBe(33)
    expect(data.averageDealCycleDays).toBe(20)
    expect(data.pipelineValueByStage).toEqual([
      { id: 'stage-1', stage: 'Gorusme', stageKey: 'discovery', count: 1, value: 10000 },
    ])
    expect(data.staffPerformance).toEqual([
      {
        id: 'user-1',
        name: 'Ada Kan',
        initials: 'AK',
        deals: 1,
        revenue: 2000,
        taskLoad: 1,
        rate: 50,
      },
    ])
    expect(data.upcomingTasks[0]).toMatchObject({
      id: 'task-1',
      related: 'Aydin Hafriyat',
      assigneeName: 'Ada Kan',
      assigneeInitials: 'AK',
    })
    expect(data.recentActivities[0]).toMatchObject({
      id: 'activity-1',
      who: 'Ada Kan',
    })
    expect(data.revenueData).toHaveLength(6)
  })
})
