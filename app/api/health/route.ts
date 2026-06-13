import { NextResponse } from 'next/server'
import { getRuntimeHealthSummary } from '@/lib/health-runtime'

export async function GET() {
  const summary = await getRuntimeHealthSummary()

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
