import { db } from '@/lib/db/prisma'
import { buildHealthSummary } from '@/lib/health'

export async function getRuntimeHealthSummary() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL)
  const directUrlConfigured = Boolean(process.env.DIRECT_URL)
  const sessionSecretConfigured = Boolean(
    process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? process.env.SESSION_SECRET,
  )
  const appUrlConfigured = Boolean(
    process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? process.env.APP_URL,
  )

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
