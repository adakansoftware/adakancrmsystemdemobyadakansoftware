import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/prisma'
import { getCurrentSession } from '@/lib/auth/session'
import { toNumber } from '@/lib/format'

function csvEscape(value: unknown) {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

function toCsv(headers: string[], rows: Array<Array<unknown>>) {
  return [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => row.map(csvEscape).join(',')),
  ].join('\n')
}

export async function GET(request: NextRequest) {
  const session = await getCurrentSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const entity = request.nextUrl.searchParams.get('entity')

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
      ['ID', 'Firma', 'Sektör', 'Şehir', 'Sorumlu', 'Kişi Sayısı'],
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

    const csv = toCsv(
      ['ID', 'Başlık', 'Firma', 'Kaynak', 'Durum', 'Tahmini Değer', 'Sorumlu', 'Aşama'],
      leads.map((lead) => [
        lead.id,
        lead.title,
        lead.company?.name ?? '',
        lead.source,
        lead.status,
        toNumber(lead.estimatedValue),
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
    const [contacts, companies, openDeals, openLeads, tasks] = await Promise.all([
      db.contact.count({ where: { archivedAt: null } }),
      db.company.count({ where: { archivedAt: null } }),
      db.deal.findMany({
        where: { archivedAt: null, status: 'OPEN' },
        select: { amount: true },
      }),
      db.lead.count({ where: { archivedAt: null, status: 'OPEN' } }),
      db.task.count({
        where: { archivedAt: null, status: { in: ['TODO', 'IN_PROGRESS', 'BLOCKED'] } },
      }),
    ])

    const csv = toCsv(
      ['Metrik', 'Değer'],
      [
        ['Toplam Kişi', contacts],
        ['Toplam Firma', companies],
        ['Açık Lead', openLeads],
        ['Açık Deal', openDeals.length],
        ['Açık Deal Tutarı', openDeals.reduce((sum, deal) => sum + toNumber(deal.amount), 0)],
        ['Bekleyen Görev', tasks],
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
