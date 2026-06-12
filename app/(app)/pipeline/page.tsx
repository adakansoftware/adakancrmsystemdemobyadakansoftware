'use client'

import { useState } from 'react'
import { Building2, Calendar, GripVertical, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  deals as initialDeals,
  dealStageMeta,
  dealStages,
  formatCompact,
  priorityMeta,
  type Deal,
  type DealStage,
} from '@/lib/data'
import { cn } from '@/lib/utils'

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>(initialDeals)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<DealStage | null>(null)

  function moveDeal(targetStage: DealStage) {
    if (!dragId) {
      return
    }

    setDeals((currentDeals) =>
      currentDeals.map((deal) =>
        deal.id === dragId ? { ...deal, stage: targetStage } : deal,
      ),
    )
    setDragId(null)
    setOverStage(null)
  }

  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Anlaşmalarınızı sürükleyerek aşamalar arasında taşıyın"
      >
        <Button>
          <Plus data-icon="inline-start" />
          Yeni Anlaşma
        </Button>
      </PageHeader>

      <div className="-mx-4 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6">
        <div className="flex min-w-max gap-4">
          {dealStages.map((stage) => {
            const stageDeals = deals.filter((deal) => deal.stage === stage)
            const total = stageDeals.reduce((sum, deal) => sum + deal.amount, 0)

            return (
              <section
                key={stage}
                onDragOver={(event) => {
                  event.preventDefault()
                  setOverStage(stage)
                }}
                onDragLeave={() => setOverStage(null)}
                onDrop={() => moveDeal(stage)}
                className={cn(
                  'flex w-[290px] shrink-0 flex-col rounded-xl border bg-muted/40 transition-colors',
                  overStage === stage && 'border-primary bg-primary/5',
                )}
                aria-label={`${stage} sütunu`}
              >
                <div className="flex items-center justify-between gap-2 border-b px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn('size-2.5 rounded-full', dealStageMeta[stage].dot)}
                    />
                    <span className="text-sm font-semibold">{stage}</span>
                    <Badge variant="secondary">{stageDeals.length}</Badge>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatCompact(total)} ₺
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 p-2.5">
                  {stageDeals.map((deal) => (
                    <article
                      key={deal.id}
                      draggable
                      onDragStart={() => setDragId(deal.id)}
                      onDragEnd={() => setDragId(null)}
                      className={cn(
                        'group flex cursor-grab flex-col gap-2.5 rounded-lg border border-l-4 bg-card p-3 shadow-sm transition-all hover:shadow-md active:cursor-grabbing',
                        dealStageMeta[stage].accent,
                        dragId === deal.id && 'opacity-50',
                      )}
                      aria-grabbed={dragId === deal.id}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium leading-snug text-pretty">
                          {deal.title}
                        </span>
                        <GripVertical className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="size-3.5" />
                        <span className="truncate">{deal.company}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">
                          {formatCompact(deal.amount)} ₺
                        </span>
                        <Badge variant={priorityMeta[deal.priority].variant}>
                          {deal.priority}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between border-t pt-2.5">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="size-6">
                            <AvatarFallback className="bg-secondary text-[10px] font-semibold">
                              {deal.ownerInitials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {deal.owner.split(' ')[0]}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="size-3.5" />
                          {deal.dueDate}
                        </span>
                      </div>
                    </article>
                  ))}

                  <button
                    type="button"
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Plus className="size-3.5" />
                    Anlaşma ekle
                  </button>
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </>
  )
}
