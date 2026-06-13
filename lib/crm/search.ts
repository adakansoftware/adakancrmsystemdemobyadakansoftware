import type { GlobalSearchResultItem } from '@/lib/crm/view-models'
import { db } from '@/lib/db/prisma'

function fullName(firstName: string | null | undefined, lastName: string | null | undefined) {
  return [firstName, lastName].filter(Boolean).join(' ').trim()
}

export async function searchCrmRecords(query: string): Promise<GlobalSearchResultItem[]> {
  const normalizedQuery = query.trim()

  if (normalizedQuery.length < 2) {
    return []
  }

  const contains = { contains: normalizedQuery, mode: 'insensitive' as const }

  const [companies, contacts, leads, deals, tasks] = await Promise.all([
    db.company.findMany({
      where: {
        archivedAt: null,
        OR: [{ name: contains }, { legalName: contains }, { city: contains }],
      },
      select: { id: true, name: true, city: true, industry: true },
      take: 4,
      orderBy: { updatedAt: 'desc' },
    }),
    db.contact.findMany({
      where: {
        archivedAt: null,
        OR: [
          { firstName: contains },
          { lastName: contains },
          { email: contains },
          { phone: contains },
          { company: { name: contains } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        company: { select: { name: true } },
      },
      take: 4,
      orderBy: { updatedAt: 'desc' },
    }),
    db.lead.findMany({
      where: {
        archivedAt: null,
        OR: [
          { title: contains },
          { email: contains },
          { phone: contains },
          { company: { name: contains } },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        company: { select: { name: true } },
      },
      take: 4,
      orderBy: { updatedAt: 'desc' },
    }),
    db.deal.findMany({
      where: {
        archivedAt: null,
        OR: [{ title: contains }, { company: { name: contains } }, { contact: { email: contains } }],
      },
      select: {
        id: true,
        title: true,
        company: { select: { name: true } },
        amount: true,
        currency: true,
      },
      take: 4,
      orderBy: { updatedAt: 'desc' },
    }),
    db.task.findMany({
      where: {
        archivedAt: null,
        OR: [
          { title: contains },
          { company: { name: contains } },
          { contact: { firstName: contains } },
          { contact: { lastName: contains } },
          { deal: { title: contains } },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        assignee: { select: { firstName: true, lastName: true } },
      },
      take: 4,
      orderBy: [{ dueAt: 'asc' }, { updatedAt: 'desc' }],
    }),
  ])

  return [
    ...companies.map((company) => ({
      id: company.id,
      title: company.name,
      subtitle: [company.industry, company.city].filter(Boolean).join(' / ') || 'Firma kaydi',
      href: '/firmalar',
      kind: 'company' as const,
    })),
    ...contacts.map((contact) => ({
      id: contact.id,
      title: fullName(contact.firstName, contact.lastName) || 'Isimsiz kisi',
      subtitle: contact.company?.name || contact.email || 'Musteri kaydi',
      href: '/musteriler',
      kind: 'contact' as const,
    })),
    ...leads.map((lead) => ({
      id: lead.id,
      title: lead.title,
      subtitle: [lead.company?.name, lead.status].filter(Boolean).join(' / ') || 'Lead kaydi',
      href: '/leads',
      kind: 'lead' as const,
    })),
    ...deals.map((deal) => ({
      id: deal.id,
      title: deal.title,
      subtitle: [deal.company?.name, `${deal.currency} ${deal.amount.toString()}`]
        .filter(Boolean)
        .join(' / '),
      href: '/anlasmalar',
      kind: 'deal' as const,
    })),
    ...tasks.map((task) => ({
      id: task.id,
      title: task.title,
      subtitle:
        [fullName(task.assignee?.firstName, task.assignee?.lastName), task.status]
          .filter(Boolean)
          .join(' / ') || 'Gorev kaydi',
      href: '/gorevler',
      kind: 'task' as const,
    })),
  ].slice(0, 12)
}
