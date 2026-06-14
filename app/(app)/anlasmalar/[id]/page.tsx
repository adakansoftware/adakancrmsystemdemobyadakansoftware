import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRightLeft, Building2, UserRound } from 'lucide-react'
import { getAssignableUsers } from '@/lib/crm/queries'
import { getDealDetailPageData } from '@/lib/crm/queries'
import { DealDetailClient } from '@/app/(app)/anlasmalar/[id]/deal-detail-client'
import { EntityActivityComposer } from '@/components/crm/entity-activity-composer'
import { EntityActivityFeed } from '@/components/crm/entity-activity-feed'
import { EntityNotesPanel } from '@/components/crm/entity-notes-panel'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dealStatusLabels, dealStatusMeta, priorityMeta, taskStatusLabels } from '@/lib/ui-meta'
import { formatCurrency, formatDateTime } from '@/lib/format'

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [deal, users] = await Promise.all([getDealDetailPageData(id), getAssignableUsers()])

  if (!deal) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={deal.title}
        description="Deal ilerleyisini, iliskili kisileri ve aktivite akisini tek yerde yonetin."
      >
        <Badge variant={dealStatusMeta[deal.status].variant}>{dealStatusLabels[deal.status]}</Badge>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <DealDetailClient deal={deal} users={users} />

          <Card>
            <CardHeader>
              <CardTitle>Iliskili Kayitlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" />
                {deal.company ? (
                  <Link href={`/firmalar/${deal.company.id}`} className="font-medium hover:underline">
                    {deal.company.name}
                  </Link>
                ) : (
                  <span>-</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <UserRound className="size-4 text-muted-foreground" />
                {deal.contact ? (
                  <Link href={`/musteriler/${deal.contact.id}`} className="font-medium hover:underline">
                    {deal.contact.name}
                  </Link>
                ) : (
                  <span>-</span>
                )}
              </div>
              <div>
                <p className="text-muted-foreground">Pipeline / Asama</p>
                <p className="font-medium">
                  {deal.pipeline.name} / {deal.stage.name}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Tahmini Kapanis</p>
                <p className="font-medium">{formatDateTime(deal.expectedCloseAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Deal Degeri</p>
                <p className="font-medium">{formatCurrency(deal.amount, deal.currency)}</p>
              </div>
            </CardContent>
          </Card>

          <EntityNotesPanel
            notes={deal.notes}
            target={{ companyId: deal.companyId, contactId: deal.contactId, dealId: deal.id }}
            emptyLabel="Bu deal icin henuz not yok."
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aktivite Akisi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <EntityActivityComposer
                target={{ companyId: deal.companyId, contactId: deal.contactId, dealId: deal.id }}
              />
              <EntityActivityFeed
                activities={deal.activities}
                emptyLabel="Bu deal icin henuz aktivite kaydi yok."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stage Gecmisleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deal.history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Stage gecmisi yok.</p>
              ) : (
                deal.history.map((entry) => (
                  <div key={entry.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      <ArrowRightLeft className="size-4 text-muted-foreground" />
                      <span>
                        {entry.fromStage} {'->'} {entry.toStage}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {entry.actorName} / {formatDateTime(entry.movedAt)}
                    </p>
                    {entry.note ? <p className="mt-2 text-muted-foreground">{entry.note}</p> : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bagli Gorevler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deal.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Bagli gorev yok.</p>
              ) : (
                deal.tasks.map((task) => (
                  <div key={task.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.assigneeName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
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
