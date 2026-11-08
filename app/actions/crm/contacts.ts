'use server'

import { createValidatedAction } from '@/lib/actions/create-validated-action'
import { createAuditLog } from '@/lib/audit/log'
import { requirePermission } from '@/lib/auth/rbac'
import { recordTimelineActivity } from '@/lib/crm/activity'
import { db } from '@/lib/db/prisma'
import { contactSchema, deleteEntitySchema, updateContactSchema } from '@/lib/validation/crm'
import { revalidateCrmPaths } from './shared'

export async function listContacts() {
  await requirePermission('contacts:read')
  return db.contact.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { company: true },
  })
}

export const createContactAction = createValidatedAction(
  contactSchema,
  async (input) => {
    const session = await requirePermission('contacts:create')
    const contact = await db.contact.create({
      data: input,
    })

    await Promise.all([
      createAuditLog({
        actorId: session.userId,
        action: 'CREATE',
        entityType: 'Contact',
        entityId: contact.id,
        summary: `Contact created: ${contact.firstName} ${contact.lastName}`,
      }),
      recordTimelineActivity({
        actorId: session.userId,
        type: 'SYSTEM',
        subject: `Contact created: ${contact.firstName} ${contact.lastName}`,
        companyId: contact.companyId,
        contactId: contact.id,
      }),
    ])

    revalidateCrmPaths()
    return contact
  },
)

export const updateContactAction = createValidatedAction(
  updateContactSchema,
  async ({ id, ...input }) => {
    const session = await requirePermission('contacts:update')
    const contact = await db.contact.update({
      where: { id },
      data: input,
    })

    await Promise.all([
      createAuditLog({
        actorId: session.userId,
        action: 'UPDATE',
        entityType: 'Contact',
        entityId: contact.id,
        summary: `Contact updated: ${contact.firstName} ${contact.lastName}`,
      }),
      recordTimelineActivity({
        actorId: session.userId,
        type: 'STATUS_CHANGE',
        subject: `Contact updated: ${contact.firstName} ${contact.lastName}`,
        companyId: contact.companyId,
        contactId: contact.id,
      }),
    ])

    revalidateCrmPaths()
    return contact
  },
)

export const deleteContactAction = createValidatedAction(
  deleteEntitySchema,
  async ({ id }) => {
    const session = await requirePermission('contacts:delete')
    const contact = await db.contact.update({
      where: { id },
      data: { archivedAt: new Date() },
    })

    await Promise.all([
      createAuditLog({
        actorId: session.userId,
        action: 'DELETE',
        entityType: 'Contact',
        entityId: contact.id,
        summary: `Contact archived: ${contact.firstName} ${contact.lastName}`,
      }),
      recordTimelineActivity({
        actorId: session.userId,
        type: 'SYSTEM',
        subject: `Contact archived: ${contact.firstName} ${contact.lastName}`,
        companyId: contact.companyId,
        contactId: contact.id,
      }),
    ])

    revalidateCrmPaths()
    return contact
  },
)
