import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db/prisma'
import { getActivitiesTimeline, recordTimelineActivity } from '@/lib/crm/activity'

vi.mock('@/lib/db/prisma', () => ({
  db: {
    activity: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('recordTimelineActivity', () => {
  it('maps optional fields to null defaults', async () => {
    vi.mocked(db.activity.create).mockResolvedValue({ id: 'activity-1' } as never)

    await recordTimelineActivity({
      type: 'NOTE',
      subject: 'Not eklendi',
    })

    expect(db.activity.create).toHaveBeenCalledWith({
      data: {
        actorId: null,
        type: 'NOTE',
        subject: 'Not eklendi',
        description: null,
        metadata: undefined,
        companyId: null,
        contactId: null,
        leadId: null,
        dealId: null,
        taskId: null,
      },
    })
  })

  it('keeps provided relations and metadata', async () => {
    vi.mocked(db.activity.create).mockResolvedValue({ id: 'activity-2' } as never)

    await recordTimelineActivity({
      actorId: 'user-1',
      type: 'STAGE_CHANGE',
      subject: 'Asama degisti',
      description: 'Yeni asama',
      metadata: { from: 'discovery', to: 'proposal' },
      companyId: 'company-1',
      dealId: 'deal-1',
    })

    expect(db.activity.create).toHaveBeenCalledWith({
      data: {
        actorId: 'user-1',
        type: 'STAGE_CHANGE',
        subject: 'Asama degisti',
        description: 'Yeni asama',
        metadata: { from: 'discovery', to: 'proposal' },
        companyId: 'company-1',
        contactId: null,
        leadId: null,
        dealId: 'deal-1',
        taskId: null,
      },
    })
  })
})

describe('getActivitiesTimeline', () => {
  it('filters by entity and applies the default limit', async () => {
    vi.mocked(db.activity.findMany).mockResolvedValue([] as never)

    await getActivitiesTimeline({ companyId: 'company-1' })

    expect(db.activity.findMany).toHaveBeenCalledWith({
      where: {
        companyId: 'company-1',
        contactId: undefined,
        leadId: undefined,
        dealId: undefined,
        taskId: undefined,
      },
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { occurredAt: 'desc' },
      take: 50,
    })
  })

  it('honors a custom limit', async () => {
    vi.mocked(db.activity.findMany).mockResolvedValue([] as never)

    await getActivitiesTimeline({ dealId: 'deal-1', limit: 10 })

    expect(vi.mocked(db.activity.findMany).mock.calls[0][0]).toMatchObject({
      take: 10,
    })
  })
})
