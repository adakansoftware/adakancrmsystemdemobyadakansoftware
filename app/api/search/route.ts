import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth/session'
import { getRoleSlugs, hasPermission } from '@/lib/auth/rbac'
import { searchCrmRecords, type SearchEntityFilter } from '@/lib/crm/search'
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

  const roleSlugs = getRoleSlugs(session)

  const entityFilter: SearchEntityFilter = {
    company: hasPermission(roleSlugs, 'companies:read'),
    contact: hasPermission(roleSlugs, 'contacts:read'),
    lead: hasPermission(roleSlugs, 'leads:read'),
    deal: hasPermission(roleSlugs, 'deals:read'),
    task: hasPermission(roleSlugs, 'tasks:read'),
  }

  const query = parsedQuery.data.q
  const results = await searchCrmRecords(query, entityFilter)

  return NextResponse.json({ results })
}
