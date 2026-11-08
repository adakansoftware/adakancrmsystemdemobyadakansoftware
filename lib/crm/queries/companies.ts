import { db } from '@/lib/db/prisma'
import { requirePermission } from '@/lib/auth/rbac'
import { toNumber } from '@/lib/format'
import type { CompanyRow } from '@/lib/crm/view-models'
import { mapEntityActivities, mapEntityNotes } from './shared'

export async function getCompaniesManagementPageData() {
  await requirePermission('companies:read')

  const companies = await db.company.findMany({
    where: { archivedAt: null },
    include: {
      owner: { select: { firstName: true, lastName: true } },
      _count: { select: { contacts: true } },
      deals: {
        where: { archivedAt: null },
        select: { amount: true, status: true },
      },
      notes: {
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        take: 6,
        select: {
          id: true,
          title: true,
          body: true,
          isPinned: true,
          createdAt: true,
          author: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      activities: {
        orderBy: { occurredAt: 'desc' },
        take: 6,
        select: {
          id: true,
          type: true,
          subject: true,
          description: true,
          occurredAt: true,
          actor: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return companies.map((company): CompanyRow => ({
    id: company.id,
    name: company.name,
    legalName: company.legalName ?? '',
    email: company.email ?? '',
    phone: company.phone ?? '',
    website: company.website ?? '',
    sector: company.industry ?? '-',
    status: company.status,
    city: company.city ?? '-',
    country: company.country ?? '',
    addressLine1: company.addressLine1 ?? '',
    employeeCount: company.employeeCount,
    ownerId: company.ownerId,
    owner: company.owner ? `${company.owner.firstName} ${company.owner.lastName}` : 'common.unassigned',
    relatedCustomers: company._count.contacts,
    activeDeals: company.deals.filter((deal) => deal.status === 'OPEN').length,
    totalValue: company.deals.reduce((sum, deal) => sum + toNumber(deal.amount), 0),
    notes: mapEntityNotes(company.notes),
    activities: mapEntityActivities(company.activities),
  }))
}

export async function getCompanyDetailPageData(companyId: string) {
  await requirePermission('companies:read')

  const company = await db.company.findFirst({
    where: { id: companyId, archivedAt: null },
    select: {
      id: true,
      name: true,
      legalName: true,
      email: true,
      phone: true,
      website: true,
      industry: true,
      status: true,
      city: true,
      country: true,
      addressLine1: true,
      employeeCount: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      owner: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      contacts: {
        where: { archivedAt: null },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          mobilePhone: true,
          jobTitle: true,
        },
      },
      deals: {
        where: { archivedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          amount: true,
          currency: true,
          status: true,
          expectedCloseAt: true,
          contact: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          stage: { select: { key: true, name: true } },
        },
      },
      tasks: {
        where: { archivedAt: null },
        orderBy: [{ dueAt: 'asc' }, { updatedAt: 'desc' }],
        take: 8,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueAt: true,
        },
      },
      activities: {
        orderBy: { occurredAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          subject: true,
          description: true,
          occurredAt: true,
          actor: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      notes: {
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        take: 10,
        select: {
          id: true,
          title: true,
          body: true,
          isPinned: true,
          createdAt: true,
          author: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  })

  if (!company) {
    return null
  }

  return {
    ...company,
    ownerName: company.owner
      ? `${company.owner.firstName} ${company.owner.lastName}`
      : 'common.unassigned',
    contacts: company.contacts.map((contact) => ({
      id: contact.id,
      name: `${contact.firstName} ${contact.lastName}`,
      email: contact.email ?? '-',
      phone: contact.mobilePhone ?? contact.phone ?? '-',
      jobTitle: contact.jobTitle ?? '-',
    })),
    deals: company.deals.map((deal) => ({
      id: deal.id,
      title: deal.title,
      amount: toNumber(deal.amount),
      currency: deal.currency,
      status: deal.status,
      stage: deal.stage.name,
      stageKey: deal.stage.key,
      contact: deal.contact
        ? `${deal.contact.firstName} ${deal.contact.lastName}`
        : '-',
      expectedCloseAt: deal.expectedCloseAt,
    })),
    tasks: company.tasks,
    activities: mapEntityActivities(company.activities),
    notes: mapEntityNotes(company.notes),
  }
}
