'use server'

import { revalidatePath } from 'next/cache'
import { createValidatedAction } from '@/lib/actions/create-validated-action'
import { createAuditLog } from '@/lib/audit/log'
import { requirePermission } from '@/lib/auth/rbac'
import { db } from '@/lib/db/prisma'
import { deleteEntitySchema, tagSchema, updateTagSchema } from '@/lib/validation/crm'
import { revalidateCrmPaths } from './shared'

export async function listTags() {
  await requirePermission('companies:read')
  return db.tag.findMany({
    include: {
      _count: {
        select: {
          companies: true,
          contacts: true,
          deals: true,
        },
      },
    },
    orderBy: [{ name: 'asc' }],
  })
}

export const createTagAction = createValidatedAction(tagSchema, async (input) => {
  const session = await requirePermission('tags:manage')
  const tag = await db.tag.create({
    data: input,
  })

  await createAuditLog({
    actorId: session.userId,
    action: 'CREATE',
    entityType: 'Tag',
    entityId: tag.id,
    summary: `Tag created: ${tag.name}`,
  })

  revalidateCrmPaths()
  revalidatePath('/ayarlar')
  return tag
})

export const updateTagAction = createValidatedAction(
  updateTagSchema,
  async ({ id, ...input }) => {
    const session = await requirePermission('tags:manage')
    const tag = await db.tag.update({
      where: { id },
      data: input,
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'UPDATE',
      entityType: 'Tag',
      entityId: tag.id,
      summary: `Tag updated: ${tag.name}`,
    })

    revalidateCrmPaths()
    revalidatePath('/ayarlar')
    return tag
  },
)

export const deleteTagAction = createValidatedAction(
  deleteEntitySchema,
  async ({ id }) => {
    const session = await requirePermission('tags:manage')
    const tag = await db.tag.delete({
      where: { id },
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'DELETE',
      entityType: 'Tag',
      entityId: tag.id,
      summary: `Tag deleted: ${tag.name}`,
    })

    revalidateCrmPaths()
    revalidatePath('/ayarlar')
    return { id: tag.id }
  },
)
