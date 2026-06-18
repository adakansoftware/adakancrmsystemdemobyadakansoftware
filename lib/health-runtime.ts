import { db } from '@/lib/db/prisma'
import { env } from '@/lib/env'
import { buildHealthSummary } from '@/lib/health'

export async function getRuntimeHealthSummary() {
  const { databaseConfigured, directUrlConfigured, sessionSecretConfigured, appUrlConfigured } =
    env

  let databaseOk = false
  let userCount = 0

  if (databaseConfigured) {
    try {
      userCount = await db.user.count()
      databaseOk = true
    } catch {
      databaseOk = false
    }
  }

  return buildHealthSummary({
    appUrlConfigured,
    sessionSecretConfigured,
    databaseConfigured,
    directUrlConfigured,
    databaseOk,
    userCount,
  })
}
