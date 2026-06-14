import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Building2, Globe, Mail, MapPin, Phone } from 'lucide-react'
import { EntityActivityComposer } from '@/components/crm/entity-activity-composer'
import { EntityActivityFeed } from '@/components/crm/entity-activity-feed'
import { EntityNotesPanel } from '@/components/crm/entity-notes-panel'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCompanyDetailPageData } from '@/lib/crm/queries'
import { dealStatusLabels, dealStatusMeta, priorityMeta, taskStatusLabels } from '@/lib/ui-meta'
import { formatCurrency, formatDateTime } from '@/lib/format'

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const company = await getCompanyDetailPageData(id)

  if (!company) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={company.name}
        description="Kurumsal hesap bilgileri, bagli kisiler ve aktif pipeline etkisi."
      >
        <Badge variant="outline">
          <Building2 className="size-3.5" />
          {company.status}
        </Badge>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hesap Karti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <span>{company.email || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" />
                <span>{company.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-muted-foreground" />
                <span>{company.website || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                <span>{[company.city, company.country].filter(Boolean).join(', ') || '-'}</span>
              </div>
              <div>
                <p className="text-muted-foreground">Sorumlu</p>
                <p className="font-medium">{company.ownerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Toplam deal etkisi</p>
                <p className="font-medium">
                  {formatCurrency(company.deals.reduce((sum, deal) => sum + deal.amount, 0))}
                </p>
              </div>
            </CardContent>
          </Card>

          <EntityNotesPanel
            notes={company.notes}
            target={{ companyId: company.id }}
            emptyLabel="Bu firma icin henuz not yok."
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aktivite Akisi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <EntityActivityComposer target={{ companyId: company.id }} />
              <EntityActivityFeed
                activities={company.activities}
                emptyLabel="Bu firma icin henuz aktivite kaydi yok."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bagli Kisiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Bagli kisi yok.</p>
              ) : (
                company.contacts.map((contact) => (
                  <Link
                    key={contact.id}
                    href={`/musteriler/${contact.id}`}
                    className="block rounded-lg border p-3 transition-colors hover:bg-muted"
                  >
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">{contact.jobTitle}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {contact.email} / {contact.phone}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aktif Deal Kayitlari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.deals.length === 0 ? (
                <p className="text-sm text-muted-foreground">Bagli deal yok.</p>
              ) : (
                company.deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/anlasmalar/${deal.id}`}
                    className="block rounded-lg border p-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{deal.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {deal.contact} / {deal.stage}
                        </p>
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
              {company.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Bagli gorev yok.</p>
              ) : (
                company.tasks.map((task) => (
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
