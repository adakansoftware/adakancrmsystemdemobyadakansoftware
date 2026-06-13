import { NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'
import { buildHealthSummary } from '@/lib/health'

export async function GET() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL)
  const directUrlConfigured = Boolean(process.env.DIRECT_URL)
  const sessionSecretConfigured = Boolean(process.env.SESSION_SECRET)
  const appUrlConfigured = Boolean(process.env.APP_URL)

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

  const summary = buildHealthSummary({
    appUrlConfigured,
    sessionSecretConfigured,
    databaseConfigured,
    directUrlConfigured,
    databaseOk,
    userCount,
  })

  return NextResponse.json(summary, {
    status: summary.status === 'error' ? 503 : 200,
    headers: {
      'Cache-Control': 'no-store',
      'X-Health-Status': summary.status,
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
