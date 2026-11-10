import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db/prisma'
import { getCalendarPageData, getTasksPageData } from '@/lib/crm/queries/tasks'

vi.mock('@/lib/db/prisma', () => ({
  db: {
    task: { findMany: vi.fn() },
    deal: { findMany: vi.fn() },
  },
}))

vi.mock('@/lib/auth/rbac', () => ({
  requirePermission: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getTasksPageData', () => {
  it('maps relations and falls back when they are missing', async () => {
    vi.mocked(db.task.findMany).mockResolvedValue(
      [
        {
          id: 'task-1',
          title: 'Teklif gonder',
          company: { name: 'Aydin Hafriyat' },
          contact: null,
          lead: null,
          deal: null,
          priority: 'HIGH',
          status: 'TODO',
          dueAt: new Date('2026-11-20T09:00:00.000Z'),
          assigneeId: 'user-1',
          assignee: { firstName: 'Ada', lastName: 'Kan' },
        },
        {
          id: 'task-2',
          title: 'Takip aramasi',
          company: null,
          contact: { firstName: 'Caner', lastName: 'Aydin' },
          lead: null,
          deal: null,
          priority: 'LOW',
          status: 'DONE',
          dueAt: null,
          assigneeId: null,
          assignee: null,
        },
        {
          id: 'task-3',
          title: 'Lead takibi',
          company: null,
          contact: null,
          lead: { title: 'Yeni Proje' },
          deal: null,
          priority: 'MEDIUM',
          status: 'IN_PROGRESS',
          dueAt: null,
          assigneeId: null,
          assignee: null,
        },
        {
          id: 'task-4',
          title: 'Anlasma takibi',
          company: null,
          contact: null,
          lead: null,
          deal: { title: 'Buyuk Anlasma' },
          priority: 'MEDIUM',
          status: 'TODO',
          dueAt: null,
          assigneeId: null,
          assignee: null,
        },
      ] as never,
    )

    const rows = await getTasksPageData()

    expect(rows).toHaveLength(4)
    expect(rows[0]).toMatchObject({
      id: 'task-1',
      related: 'Aydin Hafriyat',
      assignee: 'Ada Kan',
      assigneeInitials: 'AK',
    })
    expect(rows[1]).toMatchObject({
      related: 'Caner Aydin',
      assignee: 'common.unassigned',
      assigneeInitials: '--',
    })
    expect(rows[2]).toMatchObject({ related: 'Yeni Proje' })
    expect(rows[3]).toMatchObject({ related: 'Buyuk Anlasma' })
  })

  it('falls back to the no-relation label when nothing is linked', async () => {
    vi.mocked(db.task.findMany).mockResolvedValue([
      {
        id: 'task-5',
        title: 'Serbest gorev',
        company: null,
        contact: null,
        lead: null,
        deal: null,
        priority: 'LOW',
        status: 'TODO',
        dueAt: null,
        assigneeId: null,
        assignee: null,
      },
    ] as never)

    const rows = await getTasksPageData()

    expect(rows[0]?.related).toBe('common.noRelation')
  })
})

describe('getCalendarPageData', () => {
  it('merges dated tasks and deals into calendar entries', async () => {
    vi.mocked(db.task.findMany).mockResolvedValue([
      {
        id: 'task-1',
        title: 'Toplanti',
        dueAt: new Date('2026-11-12T10:00:00.000Z'),
        assignee: { firstName: 'Ada', lastName: 'Kan' },
      },
      {
        id: 'task-2',
        title: 'Gorev',
        dueAt: new Date('2026-11-13T10:00:00.000Z'),
        assignee: null,
      },
    ] as never)
    vi.mocked(db.deal.findMany).mockResolvedValue([
      {
        id: 'deal-1',
        title: 'Anlasma',
        expectedCloseAt: new Date('2026-11-15T00:00:00.000Z'),
        company: { name: 'Beta A.S.' },
      },
      {
        id: 'deal-2',
        title: 'Anlasma 2',
        expectedCloseAt: new Date('2026-11-16T00:00:00.000Z'),
        company: null,
      },
    ] as never)

    const data = await getCalendarPageData()

    expect(data.tasks).toEqual([
      {
        id: 'task-1',
        date: new Date('2026-11-12T10:00:00.000Z'),
        title: 'Toplanti',
        type: 'TASK',
        with: 'Ada Kan',
      },
      {
        id: 'task-2',
        date: new Date('2026-11-13T10:00:00.000Z'),
        title: 'Gorev',
        type: 'TASK',
        with: 'common.unassigned',
      },
    ])
    expect(data.deals).toEqual([
      {
        id: 'deal-1',
        date: new Date('2026-11-15T00:00:00.000Z'),
        title: 'Anlasma',
        type: 'DEAL',
        with: 'Beta A.S.',
      },
      {
        id: 'deal-2',
        date: new Date('2026-11-16T00:00:00.000Z'),
        title: 'Anlasma 2',
        type: 'DEAL',
        with: 'common.noCompany',
      },
    ])
  })
})
