import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { getOpenCrmMetrics } from '@/lib/crm/queries'
import { db } from '@/lib/db/prisma'
import { toCsv } from '@/lib/export/csv'
import { getExportEntityPermissions } from '@/lib/export/permissions'
import { exportRouteQuerySchema } from '@/lib/validation/api'

export async function GET(request: NextRequest) {
  const session = await getCurrentSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsedQuery = exportRouteQuerySchema.safeParse({
    entity: request.nextUrl.searchParams.get('entity'),
  })

  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Unsupported export entity' }, { status: 400 })
  }

  const { entity } = parsedQuery.data

  for (const permission of getExportEntityPermissions(entity)) {
    await requirePermission(permission)
  }

  if (entity === 'contacts') {
    const contacts = await db.contact.findMany({
      where: { archivedAt: null },
      include: {
        company: { select: { name: true } },
        owner: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    })

    const csv = toCsv(
      ['ID', 'Ad', 'Soyad', 'Firma', 'E-posta', 'Telefon', 'Sorumlu'],
      contacts.map((contact) => [
        contact.id,
        contact.firstName,
        contact.lastName,
        contact.company?.name ?? '',
        contact.email ?? '',
        contact.mobilePhone ?? contact.phone ?? '',
        contact.owner ? `${contact.owner.firstName} ${contact.owner.lastName}` : '',
      ]),
    )

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="musteriler.csv"',
      },
    })
  }

  if (entity === 'companies') {
    const companies = await db.company.findMany({
      where: { archivedAt: null },
      include: {
        owner: { select: { firstName: true, lastName: true } },
        _count: { select: { contacts: true } },
      },
      orderBy: { name: 'asc' },
    })

    const csv = toCsv(
      ['ID', 'Firma', 'Sektor', 'Sehir', 'Sorumlu', 'Kisi Sayisi'],
      companies.map((company) => [
        company.id,
        company.name,
        company.industry ?? '',
        company.city ?? '',
        company.owner ? `${company.owner.firstName} ${company.owner.lastName}` : '',
        company._count.contacts,
      ]),
    )

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="firmalar.csv"',
      },
    })
  }

  if (entity === 'leads') {
    const leads = await db.lead.findMany({
      where: { archivedAt: null },
      include: {
        company: { select: { name: true } },
        owner: { select: { firstName: true, lastName: true } },
        stage: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const safeLeads = leads.map((lead) => ({
      ...lead,
      estimatedValue: lead.estimatedValue?.toString() ?? '',
    }))

    const csv = toCsv(
      ['ID', 'Baslik', 'Firma', 'Kaynak', 'Durum', 'Tahmini Deger', 'Sorumlu', 'Asama'],
      safeLeads.map((lead) => [
        lead.id,
        lead.title,
        lead.company?.name ?? '',
        lead.source,
        lead.status,
        lead.estimatedValue ?? '',
        lead.owner ? `${lead.owner.firstName} ${lead.owner.lastName}` : '',
        lead.stage.name,
      ]),
    )

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="leads.csv"',
      },
    })
  }

  if (entity === 'dashboard') {
    const metrics = await getOpenCrmMetrics()

    const csv = toCsv(
      ['Metrik', 'Deger'],
      [
        ['Toplam Kisi', metrics.totalContacts],
        ['Toplam Firma', metrics.totalCompanies],
        ['Acik Lead', metrics.openLeads],
        ['Acik Deal', metrics.openDealCount],
        ['Acik Deal Tutari', metrics.openDealValue],
        ['Bekleyen Gorev', metrics.pendingTasks],
      ],
    )

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="dashboard-raporu.csv"',
      },
    })
  }

  return NextResponse.json({ error: 'Unsupported export entity' }, { status: 400 })
}
