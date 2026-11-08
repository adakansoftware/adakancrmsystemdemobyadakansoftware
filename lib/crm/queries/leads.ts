import { db } from '@/lib/db/prisma'
import { requirePermission } from '@/lib/auth/rbac'
import { toNumber } from '@/lib/format'
import type { LeadRow } from '@/lib/crm/view-models'

export async function getLeadsPageData() {
  await requirePermission('leads:read')

  const leads = await db.lead.findMany({
    where: { archivedAt: null },
    include: {
      company: { select: { name: true } },
      contact: { select: { firstName: true, lastName: true } },
      owner: { select: { firstName: true, lastName: true } },
      stage: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return leads.map((lead): LeadRow => ({
    id: lead.id,
    title: lead.title,
    company: lead.company?.name ?? '-',
    contact: lead.contact ? `${lead.contact.firstName} ${lead.contact.lastName}` : '-',
    source: lead.source,
    temperature: lead.temperature,
    status: lead.status,
    estimatedValue: toNumber(lead.estimatedValue),
    ownerId: lead.ownerId,
    owner: lead.owner ? `${lead.owner.firstName} ${lead.owner.lastName}` : 'Atanmamis',
    stage: lead.stage.name,
    email: lead.email ?? '-',
    phone: lead.phone ?? '-',
  }))
}

export type LeadsPageData = Awaited<ReturnType<typeof getLeadsPageData>>
