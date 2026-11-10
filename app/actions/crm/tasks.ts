'use server'

import { Prisma } from '@/lib/db/generated/prisma/client'
import { createValidatedAction } from '@/lib/actions/create-validated-action'
import { createAuditLog } from '@/lib/audit/log'
import { requirePermission } from '@/lib/auth/rbac'
import { getActivitiesTimeline, recordTimelineActivity } from '@/lib/crm/activity'
import { db } from '@/lib/db/prisma'
import {
  activitySchema,
  taskSchema,
  timelineFilterSchema,
  updateTaskSchema,
} from '@/lib/validation/crm'
import { revalidateCrmPaths } from './shared'

export async function listTasks() {
  await requirePermission('tasks:read')
  return db.task.findMany({
    where: { archivedAt: null },
    include: {
      assignee: true,
      company: true,
      contact: true,
      lead: true,
      deal: true,
    },
    orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
  })
}

export const createTaskAction = createValidatedAction(taskSchema, async (input) => {
  const session = await requirePermission('tasks:create')
  const task = await db.task.create({
    data: {
      ...input,
      creatorId: session.userId,
    },
  })

  await Promise.all([
    createAuditLog({
      actorId: session.userId,
      action: 'CREATE',
      entityType: 'Task',
      entityId: task.id,
      summary: `Task created: ${task.title}`,
    }),
    recordTimelineActivity({
      actorId: session.userId,
      type: 'TASK',
      subject: `Task created: ${task.title}`,
      companyId: task.companyId,
      contactId: task.contactId,
      leadId: task.leadId,
      dealId: task.dealId,
      taskId: task.id,
    }),
  ])

  revalidateCrmPaths()
  return task
})

export const updateTaskAction = createValidatedAction(
  updateTaskSchema,
  async ({ id, ...input }) => {
    const session = await requirePermission('tasks:update')
    const task = await db.task.update({
      where: { id },
      data: {
        ...input,
        completedAt:
          input.status == null
            ? undefined
            : input.status === 'DONE'
              ? new Date()
              : null,
      },
    })

    await Promise.all([
      createAuditLog({
        actorId: session.userId,
        action: 'UPDATE',
        entityType: 'Task',
        entityId: task.id,
        summary: `Task updated: ${task.title}`,
      }),
      recordTimelineActivity({
        actorId: session.userId,
        type: 'STATUS_CHANGE',
        subject: `Task updated: ${task.title}`,
        companyId: task.companyId,
        contactId: task.contactId,
        leadId: task.leadId,
        dealId: task.dealId,
        taskId: task.id,
      }),
    ])

    revalidateCrmPaths()
    return task
  },
)

export const createActivityAction = createValidatedAction(
  activitySchema,
  async (input) => {
    const session = await requirePermission('activities:create')
    const activity = await db.activity.create({
      data: {
        actorId: input.actorId ?? session.userId,
        companyId: input.companyId ?? null,
        contactId: input.contactId ?? null,
        leadId: input.leadId ?? null,
        dealId: input.dealId ?? null,
        taskId: input.taskId ?? null,
        type: input.type,
        subject: input.subject,
        description: input.description ?? null,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        occurredAt: input.occurredAt,
      },
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'CREATE',
      entityType: 'Activity',
      entityId: activity.id,
      summary: `Activity created: ${activity.subject}`,
    })

    revalidateCrmPaths()
    return activity
  },
)

export const getTimelineAction = createValidatedAction(
  timelineFilterSchema,
  async (input) => {
    await requirePermission('activities:read')
    return getActivitiesTimeline(input)
  },
)
