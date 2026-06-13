'use client'

import Link from 'next/link'
import { useMemo, useOptimistic, useState, useTransition } from 'react'
import { Building2, Calendar, ChevronLeft, ChevronRight, GripVertical, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { moveDealToStageAction } from '@/app/actions/crm'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PipelineBoardData = {
  pipeline: {
    id: string
    name: string
    key: string
  }
  stages: Array<{
    id: string
    name: string
    key: string
    position: number
    probability: number
    isClosed: boolean
    isWon: boolean
    deals: Array<{
      id: string
      title: string
      company: string
      amount: number
      currency: string
      ownerName: string
      ownerInitials: string
      dueDate: string
      priority: string
      status: string
    }>
  }>
  metrics: {
    totalValue: number
    wonValue: number
    lostValue: number
  }
}

function formatCompactCurrency(amount: number, currency: string) {
  return `${new Intl.NumberFormat('tr-TR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)} ${currency}`
}

function getStageMoveLabel(dealTitle: string, stageName: string | undefined, direction: 'next' | 'previous') {
  if (!stageName) {
    return direction === 'previous'
      ? `${dealTitle} kaydi icin onceki asama yok`
      : `${dealTitle} kaydi icin sonraki asama yok`
  }

  return `${dealTitle} kaydini ${stageName} asamasina tasi`
}

const priorityVariant: Record<string, 'secondary' | 'info' | 'warning'> = {
  LOW: 'secondary',
  MEDIUM: 'info',
  HIGH: 'warning',
}

export function PipelineBoardClient({
  initialBoard,
}: {
  initialBoard: PipelineBoardData
}) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [optimisticBoard, moveOptimisticDeal] = useOptimistic(
    initialBoard,
    (state, payload: { dealId: string; stageId: string }) => {
      const movingDeal = state.stages
        .flatMap((stage) => stage.deals)
        .find((deal) => deal.id === payload.dealId)

      if (!movingDeal) {
        return state
      }

      return {
        ...state,
        stages: state.stages.map((stage) => {
          if (stage.id === payload.stageId) {
            return {
              ...stage,
              deals: [...stage.deals, movingDeal],
            }
          }

          return {
            ...stage,
            deals: stage.deals.filter((deal) => deal.id !== payload.dealId),
          }
        }),
      }
    },
  )

  const metrics = useMemo(() => {
    const totalValue = optimisticBoard.stages
      .flatMap((stage) => stage.deals)
      .reduce((sum, deal) => sum + deal.amount, 0)

    const wonValue = optimisticBoard.stages
      .filter((stage) => stage.isWon)
      .flatMap((stage) => stage.deals)
      .reduce((sum, deal) => sum + deal.amount, 0)

    const lostValue = optimisticBoard.stages
      .filter((stage) => stage.isClosed && !stage.isWon)
      .flatMap((stage) => stage.deals)
      .reduce((sum, deal) => sum + deal.amount, 0)

    return { totalValue, wonValue, lostValue }
  }, [optimisticBoard])

  function findStageForDeal(dealId: string) {
    return optimisticBoard.stages.find((stage) => stage.deals.some((deal) => deal.id === dealId))
  }

  function moveDeal(dealId: string, targetStageId: string, note: string) {
    const currentStage = findStageForDeal(dealId)

    if (!currentStage || currentStage.id === targetStageId) {
      return
    }

    moveOptimisticDeal({ dealId, stageId: targetStageId })
    const targetStage = optimisticBoard.stages.find((stage) => stage.id === targetStageId)

    if (targetStage) {
      startTransition(async () => {
        const result = await moveDealToStageAction({
          dealId,
          toPipelineId: optimisticBoard.pipeline.id,
          toStageId: targetStage.id,
          note,
        })

        if (!result.success) {
          toast.error('Pipeline hareketi kaydedilemedi')
        }
      })
    }
  }

  function handleDrop(stageId: string) {
    if (!dragId) {
      return
    }

    moveDeal(dragId, stageId, 'Drag and drop pipeline move')
    setDragId(null)
    setOverStage(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Toplam deger</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatCompactCurrency(metrics.totalValue, 'TRY')}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Kazanilan deger</p>
          <p className="mt-1 text-2xl font-semibold text-success">
            {formatCompactCurrency(metrics.wonValue, 'TRY')}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Kaybedilen deger</p>
          <p className="mt-1 text-2xl font-semibold text-destructive">
            {formatCompactCurrency(metrics.lostValue, 'TRY')}
          </p>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6">
        <div className="flex min-w-max gap-4">
          {optimisticBoard.stages.map((stage) => {
            const stageTotal = stage.deals.reduce((sum, deal) => sum + deal.amount, 0)
            const stageIndex = optimisticBoard.stages.findIndex((entry) => entry.id === stage.id)
            const previousStage = optimisticBoard.stages[stageIndex - 1]
            const nextStage = optimisticBoard.stages[stageIndex + 1]

            return (
              <section
                key={stage.id}
                onDragOver={(event) => {
                  event.preventDefault()
                  setOverStage(stage.id)
                }}
                onDragLeave={() => setOverStage(null)}
                onDrop={() => handleDrop(stage.id)}
                className={cn(
                  'flex w-[290px] shrink-0 flex-col rounded-xl border bg-muted/40 transition-colors',
                  overStage === stage.id && 'border-primary bg-primary/5',
                )}
                aria-label={`${stage.name} sutunu`}
              >
                <div className="flex items-center justify-between gap-2 border-b px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{stage.name}</span>
                    <Badge variant="secondary">{stage.deals.length}</Badge>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatCompactCurrency(stageTotal, 'TRY')}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 p-2.5">
                  {stage.deals.map((deal) => (
                    <article
                      key={deal.id}
                      draggable={!isPending}
                      onDragStart={() => setDragId(deal.id)}
                      onDragEnd={() => setDragId(null)}
                      className={cn(
                        'group flex cursor-grab flex-col gap-2.5 rounded-lg border border-l-4 bg-card p-3 shadow-sm transition-all hover:shadow-md active:cursor-grabbing',
                        stage.isWon
                          ? 'border-l-success'
                          : stage.isClosed
                            ? 'border-l-destructive'
                            : 'border-l-primary',
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
                          {formatCompactCurrency(deal.amount, deal.currency)}
                        </span>
                        <Badge variant={priorityVariant[deal.priority] ?? 'secondary'}>
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
                            {deal.ownerName.split(' ')[0]}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="size-3.5" />
                          {deal.dueDate ? deal.dueDate.slice(0, 10) : '-'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t pt-2">
                        <span className="text-[11px] text-muted-foreground">
                          Klavye veya dokunmatik icin asama degistirme
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-7"
                            disabled={!previousStage || isPending}
                            aria-label={getStageMoveLabel(deal.title, previousStage?.name, 'previous')}
                            onClick={() =>
                              previousStage
                                ? moveDeal(deal.id, previousStage.id, 'Pipeline button move backward')
                                : undefined
                            }
                          >
                            <ChevronLeft className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-7"
                            disabled={!nextStage || isPending}
                            aria-label={getStageMoveLabel(deal.title, nextStage?.name, 'next')}
                            onClick={() =>
                              nextStage
                                ? moveDeal(deal.id, nextStage.id, 'Pipeline button move forward')
                                : undefined
                            }
                          >
                            <ChevronRight className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-center"
                    nativeButton={false}
                    render={
                      <Link href="/pipeline?quickCreate=deal">
                        <Plus data-icon="inline-start" />
                        Anlasma ekle
                      </Link>
                    }
                  />
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
