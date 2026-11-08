'use server'

import { createValidatedAction } from '@/lib/actions/create-validated-action'
import { createAuditLog } from '@/lib/audit/log'
import { requirePermission } from '@/lib/auth/rbac'
import { recordTimelineActivity } from '@/lib/crm/activity'
import { db } from '@/lib/db/prisma'
import {
  deleteEntitySchema,
  noteSchema,
  updateNoteSchema,
} from '@/lib/validation/crm'
import { revalidateCrmPaths } from './shared'

export async function listNotes(filters: {
  companyId?: string
  contactId?: string
  leadId?: string
  dealId?: string
  taskId?: string
}) {
  await requirePermission('notes:read')
  return db.note.findMany({
    where: filters,
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
  })
}

export const createNoteAction = createValidatedAction(noteSchema, async (input) => {
  const session = await requirePermission('notes:create')
  const note = await db.note.create({
    data: {
      ...input,
      authorId: session.userId,
    },
  })

  await Promise.all([
    createAuditLog({
      actorId: session.userId,
      action: 'CREATE',
      entityType: 'Note',
      entityId: note.id,
      summary: `Note created`,
    }),
    recordTimelineActivity({
      actorId: session.userId,
      type: 'NOTE',
      subject: input.title?.trim() || 'Note added',
      description: note.body,
      companyId: note.companyId,
      contactId: note.contactId,
      leadId: note.leadId,
      dealId: note.dealId,
      taskId: note.taskId,
    }),
  ])

  revalidateCrmPaths()
  return note
})

export const updateNoteAction = createValidatedAction(
  updateNoteSchema,
  async ({ id, ...input }) => {
    const session = await requirePermission('notes:update')
    const note = await db.note.update({
      where: { id },
      data: input,
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'UPDATE',
      entityType: 'Note',
      entityId: note.id,
      summary: `Note updated`,
    })

    revalidateCrmPaths()
    return note
  },
)

export const deleteNoteAction = createValidatedAction(
  deleteEntitySchema,
  async ({ id }) => {
    const session = await requirePermission('notes:delete')
    const note = await db.note.delete({
      where: { id },
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'DELETE',
      entityType: 'Note',
      entityId: note.id,
      summary: `Note deleted`,
    })

    revalidateCrmPaths()
    return { id: note.id }
  },
)
