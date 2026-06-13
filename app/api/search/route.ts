import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth/session'
import { searchCrmRecords } from '@/lib/crm/search'

export async function GET(request: NextRequest) {
  const session = await getCurrentSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const query = request.nextUrl.searchParams.get('q') ?? ''
  const results = await searchCrmRecords(query)

  return NextResponse.json({ results })
}
