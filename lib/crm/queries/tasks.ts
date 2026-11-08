import { db } from '@/lib/db/prisma'
import { requirePermission } from '@/lib/auth/rbac'
import type { TaskRow } from '@/lib/crm/view-models'

export async function getTasksPageData() {
  await requirePermission('tasks:read')

  const tasks = await db.task.findMany({
    where: { archivedAt: null },
    include: {
      assignee: { select: { firstName: true, lastName: true } },
      company: { select: { name: true } },
      contact: { select: { firstName: true, lastName: true } },
      lead: { select: { title: true } },
      deal: { select: { title: true } },
    },
    orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
  })

  return tasks.map((task): TaskRow => ({
    id: task.id,
    title: task.title,
    related:
      task.company?.name ??
      (task.contact
        ? `${task.contact.firstName} ${task.contact.lastName}`
        : task.lead?.title ?? task.deal?.title ?? 'common.noRelation'),
    priority: task.priority,
    status: task.status,
    dueAt: task.dueAt,
    assigneeId: task.assigneeId,
    assignee: task.assignee
      ? `${task.assignee.firstName} ${task.assignee.lastName}`
      : 'common.unassigned',
    assigneeInitials: task.assignee
      ? `${task.assignee.firstName[0] ?? ''}${task.assignee.lastName[0] ?? ''}`
      : '--',
  }))
}

export async function getCalendarPageData() {
  await requirePermission('tasks:read')

  const [tasks, deals] = await Promise.all([
    db.task.findMany({
      where: {
        archivedAt: null,
        dueAt: { not: null },
      },
      include: {
        assignee: { select: { firstName: true, lastName: true } },
      },
      orderBy: { dueAt: 'asc' },
      take: 50,
    }),
    db.deal.findMany({
      where: {
        archivedAt: null,
        expectedCloseAt: { not: null },
      },
      include: {
        company: { select: { name: true } },
      },
      orderBy: { expectedCloseAt: 'asc' },
      take: 50,
    }),
  ])

  return {
    tasks: tasks.map((task) => ({
      id: task.id,
      date: task.dueAt!,
      title: task.title,
      type: 'TASK' as const,
      with: task.assignee
        ? `${task.assignee.firstName} ${task.assignee.lastName}`
        : 'common.unassigned',
    })),
    deals: deals.map((deal) => ({
      id: deal.id,
      date: deal.expectedCloseAt!,
      title: deal.title,
      type: 'DEAL' as const,
      with: deal.company?.name ?? 'common.noCompany',
    })),
  }
}

export type TasksPageData = Awaited<ReturnType<typeof getTasksPageData>>
