import type { GlobalSearchResultItem } from '@/lib/crm/view-models'
import { db } from '@/lib/db/prisma'

export type SearchEntityKind = 'company' | 'contact' | 'lead' | 'deal' | 'task'

export type SearchEntityFilter = Record<SearchEntityKind, boolean>

function fullName(firstName: string | null | undefined, lastName: string | null | undefined) {
  return [firstName, lastName].filter(Boolean).join(' ').trim()
}

export async function searchCrmRecords(
  query: string,
  entityFilter?: Partial<SearchEntityFilter>,
): Promise<GlobalSearchResultItem[]> {
  const normalizedQuery = query.trim()

  if (normalizedQuery.length < 2) {
    return []
  }

  const isEnabled = (kind: SearchEntityKind) => entityFilter?.[kind] ?? true
  const contains = { contains: normalizedQuery, mode: 'insensitive' as const }

  const [companies, contacts, leads, deals, tasks] = await Promise.all([
    isEnabled('company')
      ? db.company.findMany({
          where: {
            archivedAt: null,
            OR: [{ name: contains }, { legalName: contains }, { city: contains }],
          },
          select: { id: true, name: true, city: true, industry: true },
          take: 4,
          orderBy: { updatedAt: 'desc' },
        })
      : [],
    isEnabled('contact')
      ? db.contact.findMany({
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
        })
      : [],
    isEnabled('lead')
      ? db.lead.findMany({
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
        })
      : [],
    isEnabled('deal')
      ? db.deal.findMany({
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
        })
      : [],
    isEnabled('task')
      ? db.task.findMany({
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
        })
      : [],
  ])

  return [
    ...companies.map((company) => ({
      id: company.id,
      title: company.name,
      subtitle: [company.industry, company.city].filter(Boolean).join(' / ') || 'search.companyRecord',
      href: '/firmalar',
      kind: 'company' as const,
    })),
    ...contacts.map((contact) => ({
      id: contact.id,
      title: fullName(contact.firstName, contact.lastName) || 'search.unnamedContact',
      subtitle: contact.company?.name || contact.email || 'search.contactRecord',
      href: '/musteriler',
      kind: 'contact' as const,
    })),
    ...leads.map((lead) => ({
      id: lead.id,
      title: lead.title,
      subtitle: [lead.company?.name, lead.status].filter(Boolean).join(' / ') || 'search.leadRecord',
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
          .join(' / ') || 'search.taskRecord',
      href: '/gorevler',
      kind: 'task' as const,
    })),
  ].slice(0, 12)
}
