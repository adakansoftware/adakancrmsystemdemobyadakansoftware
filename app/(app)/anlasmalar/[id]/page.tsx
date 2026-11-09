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
import { dealStatusMeta, priorityMeta } from '@/lib/ui-meta'
import { createEnumLabels } from '@/lib/i18n/enums'
import { displayStageName } from '@/lib/i18n/stages'
import { getI18n } from '@/lib/i18n/server'
import { formatCurrency, formatDateTime } from '@/lib/format'

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { t } = await getI18n()
  const labels = createEnumLabels(t)
  const [deal, users] = await Promise.all([getDealDetailPageData(id), getAssignableUsers()])

  if (!deal) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader title={deal.title} description={t('dealDetail.description')}>
        <Badge variant={dealStatusMeta[deal.status].variant}>{labels.dealStatus[deal.status]}</Badge>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <DealDetailClient deal={deal} users={users} />

          <Card>
            <CardHeader>
              <CardTitle>{t('dealDetail.relatedRecords')}</CardTitle>
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
                <p className="text-muted-foreground">{t('dealDetail.pipelineStage')}</p>
                <p className="font-medium">
                  {deal.pipeline.name} / {deal.stage.name}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('common.expectedClose')}</p>
                <p className="font-medium">{formatDateTime(deal.expectedCloseAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('dealDetail.dealValue')}</p>
                <p className="font-medium">{formatCurrency(deal.amount, deal.currency)}</p>
              </div>
            </CardContent>
          </Card>

          <EntityNotesPanel
            notes={deal.notes}
            target={{ companyId: deal.companyId, contactId: deal.contactId, dealId: deal.id }}
            emptyLabel={t('dealDetail.noNotes')}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('dealDetail.activityFeed')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <EntityActivityComposer
                target={{ companyId: deal.companyId, contactId: deal.contactId, dealId: deal.id }}
              />
              <EntityActivityFeed
                activities={deal.activities}
                emptyLabel={t('dealDetail.noActivities')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dealDetail.stageHistory')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deal.history.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('dealDetail.noHistory')}</p>
              ) : (
                deal.history.map((entry) => (
                  <div key={entry.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      <ArrowRightLeft className="size-4 text-muted-foreground" />
                      <span>
                        {entry.fromStage ? displayStageName(entry.fromStage, t) : t('common.start')}{' '}
                        {'->'} {displayStageName(entry.toStage, t)}
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
              <CardTitle>{t('dealDetail.tasks')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deal.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('dealDetail.noTasks')}</p>
              ) : (
                deal.tasks.map((task) => (
                  <div key={task.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.assigneeName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {task.dueAt ? formatDateTime(task.dueAt) : t('common.noDueDate')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={priorityMeta[task.priority].variant}>{task.priority}</Badge>
                        <Badge variant="outline">{labels.taskStatus[task.status]}</Badge>
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
