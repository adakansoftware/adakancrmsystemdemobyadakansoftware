import type { AuditAction, Prisma } from '@/lib/db/generated/prisma/client'
import { db } from '@/lib/db/prisma'
import { getRequestMetadata, type RequestMetadata } from '@/lib/request/request-metadata'

type AuditLogInput = {
  actorId?: string | null
  action: AuditAction
  entityType: string
  entityId?: string | null
  summary: string
  metadata?: Prisma.InputJsonValue
}

export async function createAuditLog(input: AuditLogInput) {
  let requestMetadata: RequestMetadata = {
    ipAddress: null,
    userAgent: null,
  }

  try {
    requestMetadata = await getRequestMetadata()
  } catch {
    requestMetadata = {
      ipAddress: null,
      userAgent: null,
    }
  }

  return db.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary,
      metadata: input.metadata,
      ipAddress: requestMetadata.ipAddress,
      userAgent: requestMetadata.userAgent,
    },
  })
}
