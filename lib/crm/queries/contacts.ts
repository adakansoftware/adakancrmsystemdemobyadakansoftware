import { db } from '@/lib/db/prisma'
import { requirePermission } from '@/lib/auth/rbac'
import { toNumber } from '@/lib/format'
import type { ContactRow } from '@/lib/crm/view-models'
import { mapEntityActivities, mapEntityNotes } from './shared'

export async function getContactsManagementPageData() {
  await requirePermission('contacts:read')

  const contacts = await db.contact.findMany({
    where: { archivedAt: null },
    include: {
      company: { select: { name: true, city: true, industry: true } },
      owner: { select: { firstName: true, lastName: true } },
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
    },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  })

  return contacts.map((contact): ContactRow => ({
    id: contact.id,
    companyId: contact.companyId,
    ownerId: contact.ownerId,
    createdAt: contact.createdAt,
    firstName: contact.firstName,
    lastName: contact.lastName,
    name: `${contact.firstName} ${contact.lastName}`,
    company: contact.company?.name ?? '-',
    city: contact.company?.city ?? '-',
    industry: contact.company?.industry ?? '-',
    jobTitle: contact.jobTitle ?? '',
    email: contact.email ?? '-',
    phone: contact.mobilePhone ?? contact.phone ?? '-',
    mobilePhone: contact.mobilePhone ?? '',
    owner: contact.owner ? `${contact.owner.firstName} ${contact.owner.lastName}` : 'Atanmamis',
    lastActivityAt: contact.activities[0]?.occurredAt ?? null,
    lastActivitySubject: contact.activities[0]?.subject ?? 'Henuz aktivite yok',
    relatedDealValue: contact.deals
      .filter((deal) => deal.status === 'OPEN')
      .reduce((sum, deal) => sum + toNumber(deal.amount), 0),
    notes: mapEntityNotes(contact.notes),
    activities: mapEntityActivities(contact.activities),
  }))
}

export async function getContactDetailPageData(contactId: string) {
  await requirePermission('contacts:read')

  const contact = await db.contact.findFirst({
    where: { id: contactId, archivedAt: null },
    select: {
      id: true,
      companyId: true,
      ownerId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      mobilePhone: true,
      jobTitle: true,
      linkedinUrl: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          id: true,
          name: true,
          city: true,
          industry: true,
        },
      },
      owner: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      deals: {
        where: { archivedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          amount: true,
          currency: true,
          status: true,
          stage: { select: { name: true } },
          expectedCloseAt: true,
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

  if (!contact) {
    return null
  }

  return {
    id: contact.id,
    companyId: contact.companyId,
    ownerId: contact.ownerId,
    name: `${contact.firstName} ${contact.lastName}`,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email ?? '-',
    phone: contact.mobilePhone ?? contact.phone ?? '-',
    mobilePhone: contact.mobilePhone ?? '',
    jobTitle: contact.jobTitle ?? '-',
    linkedinUrl: contact.linkedinUrl ?? '',
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
    company: contact.company,
    owner: contact.owner
      ? `${contact.owner.firstName} ${contact.owner.lastName}`
      : 'Atanmamis',
    deals: contact.deals.map((deal) => ({
      id: deal.id,
      title: deal.title,
      amount: toNumber(deal.amount),
      currency: deal.currency,
      status: deal.status,
      stage: deal.stage.name,
      expectedCloseAt: deal.expectedCloseAt,
    })),
    tasks: contact.tasks,
    activities: mapEntityActivities(contact.activities),
    notes: mapEntityNotes(contact.notes),
  }
}
