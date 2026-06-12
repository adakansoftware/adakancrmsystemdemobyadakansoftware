import type { AuditAction, Prisma } from '@prisma/client'
import { db } from '@/lib/db/prisma'

type AuditLogInput = {
  actorId?: string | null
  action: AuditAction
  entityType: string
  entityId?: string | null
  summary: string
  metadata?: Prisma.InputJsonValue
}

export async function createAuditLog(input: AuditLogInput) {
  return db.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary,
      metadata: input.metadata,
    },
  })
}
