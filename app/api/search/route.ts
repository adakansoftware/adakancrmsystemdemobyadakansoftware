import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth/session'
import { searchCrmRecords } from '@/lib/crm/search'
import { searchRouteQuerySchema } from '@/lib/validation/api'

export async function GET(request: NextRequest) {
  const session = await getCurrentSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsedQuery = searchRouteQuerySchema.safeParse({
    q: request.nextUrl.searchParams.get('q') ?? '',
  })

  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Invalid search query' }, { status: 400 })
  }

  const query = parsedQuery.data.q
  const results = await searchCrmRecords(query)

  return NextResponse.json({ results })
}
