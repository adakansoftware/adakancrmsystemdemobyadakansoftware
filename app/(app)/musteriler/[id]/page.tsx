import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Building2, Mail, Phone } from 'lucide-react'
import { listCompanies } from '@/app/actions/crm'
import { ContactDetailClient } from '@/app/(app)/musteriler/[id]/contact-detail-client'
import { EntityActivityComposer } from '@/components/crm/entity-activity-composer'
import { EntityActivityFeed } from '@/components/crm/entity-activity-feed'
import { EntityNotesPanel } from '@/components/crm/entity-notes-panel'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAssignableUsers, getContactDetailPageData } from '@/lib/crm/queries'
import { dealStatusMeta, dealStatusLabels, priorityMeta, taskStatusLabels } from '@/lib/ui-meta'
import { formatCurrency, formatDateTime } from '@/lib/format'

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [contact, users, companies] = await Promise.all([
    getContactDetailPageData(id),
    getAssignableUsers(),
    listCompanies(),
  ])

  if (!contact) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={contact.name}
        description="Kisi bilgileri, son aktiviteler ve bagli satis isleri tek ekranda."
      >
        {contact.company ? (
          <Badge variant="outline">
            <Building2 className="size-3.5" />
            {contact.company.name}
          </Badge>
        ) : null}
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <ContactDetailClient
            contact={contact}
            users={users}
            companies={companies.map((company) => ({ id: company.id, name: company.name }))}
          />

          <Card>
            <CardHeader>
              <CardTitle>Hizli Ozet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <span>{contact.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" />
                <span>{contact.phone}</span>
              </div>
              <div>
                <p className="text-muted-foreground">Son guncelleme</p>
                <p className="font-medium">{formatDateTime(contact.updatedAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Notlar</p>
                <p className="font-medium">{contact.notes.length} kayit</p>
              </div>
            </CardContent>
          </Card>

          <EntityNotesPanel
            notes={contact.notes}
            target={{ companyId: contact.companyId, contactId: contact.id }}
            emptyLabel="Bu kisi icin henuz not yok."
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aktivite Akisi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <EntityActivityComposer target={{ companyId: contact.companyId, contactId: contact.id }} />
              <EntityActivityFeed
                activities={contact.activities}
                emptyLabel="Bu kisi icin henuz aktivite kaydi yok."
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Iliskili Deal Kayitlari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contact.deals.length === 0 ? (
                <p className="text-sm text-muted-foreground">Bagli deal yok.</p>
              ) : (
                contact.deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/anlasmalar/${deal.id}`}
                    className="block rounded-lg border p-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{deal.title}</p>
                        <p className="text-xs text-muted-foreground">{deal.stage}</p>
                      </div>
                      <Badge variant={dealStatusMeta[deal.status].variant}>
                        {dealStatusLabels[deal.status]}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium">
                      {formatCurrency(deal.amount, deal.currency)}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gorevler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contact.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Bagli gorev yok.</p>
              ) : (
                contact.tasks.map((task) => (
                  <div key={task.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.dueAt ? formatDateTime(task.dueAt) : 'Teslim tarihi yok'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={priorityMeta[task.priority].variant}>{task.priority}</Badge>
                        <Badge variant="outline">{taskStatusLabels[task.status]}</Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
