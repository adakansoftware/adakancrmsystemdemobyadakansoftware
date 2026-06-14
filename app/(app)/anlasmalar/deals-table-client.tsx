'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { moveDealToStageAction, updateDealAction } from '@/app/actions/crm'
import { InlineSelectField } from '@/components/crm/inline-select-field'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { dealStatuses, type DealRow, type UserOption } from '@/lib/crm/view-models'
import { formatCurrency, formatDate } from '@/lib/format'
import { dealStatusLabels } from '@/lib/ui-meta'

export function DealsTableClient({
  deals,
  users,
}: {
  deals: DealRow[]
  users: UserOption[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingDealId, setPendingDealId] = useState<string | null>(null)

  function refreshWithSuccess(message: string) {
    toast.success(message)
    router.refresh()
  }

  function updateDealOwner(dealId: string, ownerId: string | null) {
    startTransition(async () => {
      try {
        setPendingDealId(dealId)
        const result = await updateDealAction({ id: dealId, ownerId })

        if (!result.success) {
          throw new Error('Anlasma sorumlusu guncellenemedi')
        }

        refreshWithSuccess('Anlasma sorumlusu guncellendi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Anlasma guncellemesi basarisiz')
      } finally {
        setPendingDealId(null)
      }
    })
  }

  function updateDealStage(deal: DealRow, stageId: string) {
    startTransition(async () => {
      try {
        setPendingDealId(deal.id)
        const result = await moveDealToStageAction({
          dealId: deal.id,
          toPipelineId: deal.pipelineId,
          toStageId: stageId,
        })

        if (!result.success) {
          throw new Error('Anlasma asamasi guncellenemedi')
        }

        refreshWithSuccess('Anlasma asamasi guncellendi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Asama degisikligi basarisiz')
      } finally {
        setPendingDealId(null)
      }
    })
  }

  function updateDealStatus(deal: DealRow, status: DealRow['status']) {
    startTransition(async () => {
      try {
        setPendingDealId(deal.id)

        if (status === 'ABANDONED') {
          const result = await updateDealAction({ id: deal.id, status })
          if (!result.success) {
            throw new Error('Anlasma durumu guncellenemedi')
          }
        } else {
          const targetStage =
            status === 'OPEN'
              ? deal.availableStages.find((stage) => !stage.isClosed)
              : deal.availableStages.find((stage) =>
                  status === 'WON' ? stage.isClosed && stage.isWon : stage.isClosed && !stage.isWon,
                )

          if (!targetStage) {
            throw new Error('Bu durum icin uygun stage bulunamadi')
          }

          const result = await moveDealToStageAction({
            dealId: deal.id,
            toPipelineId: deal.pipelineId,
            toStageId: targetStage.id,
          })

          if (!result.success) {
            throw new Error('Anlasma durumu guncellenemedi')
          }
        }

        refreshWithSuccess('Anlasma durumu guncellendi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Durum degisikligi basarisiz')
      } finally {
        setPendingDealId(null)
      }
    })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Anlasma</TableHead>
          <TableHead className="max-lg:hidden">Firma / Kisi</TableHead>
          <TableHead className="min-w-40">Durum</TableHead>
          <TableHead className="min-w-44 max-lg:hidden">Asama</TableHead>
          <TableHead className="text-right">Tutar</TableHead>
          <TableHead className="text-right max-md:hidden">Olasilik</TableHead>
          <TableHead className="min-w-44 max-xl:hidden">Sorumlu</TableHead>
          <TableHead className="text-right max-sm:hidden">Kapanis</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deals.map((deal) => {
          const isRowPending = isPending && pendingDealId === deal.id

          return (
            <TableRow key={deal.id} data-testid={`deal-row-${deal.id}`}>
              <TableCell>
                <div className="flex flex-col">
                  <Link href={`/anlasmalar/${deal.id}`} className="font-medium hover:underline">
                    {deal.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">{deal.id}</span>
                </div>
              </TableCell>
              <TableCell className="max-lg:hidden">
                <div className="flex flex-col">
                  <span>{deal.company}</span>
                  <span className="text-xs text-muted-foreground">{deal.contact}</span>
                </div>
              </TableCell>
              <TableCell className="min-w-40">
                <InlineSelectField
                  value={deal.status}
                  onValueChange={(value) => updateDealStatus(deal, value)}
                  disabled={isRowPending}
                  testId={`deal-status-${deal.id}`}
                  ariaLabel={`${deal.title} durumunu degistir`}
                  options={dealStatuses.map((status) => ({
                    value: status,
                    label: dealStatusLabels[status],
                  }))}
                />
              </TableCell>
              <TableCell className="min-w-44 max-lg:hidden">
                <InlineSelectField
                  value={deal.stageId}
                  onValueChange={(value) => updateDealStage(deal, value)}
                  disabled={isRowPending}
                  testId={`deal-stage-${deal.id}`}
                  ariaLabel={`${deal.title} asamasini degistir`}
                  options={deal.availableStages.map((stage) => ({
                    value: stage.id,
                    label: stage.name,
                  }))}
                />
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(deal.amount, deal.currency)}
              </TableCell>
              <TableCell className="text-right max-md:hidden">%{deal.probability}</TableCell>
              <TableCell className="min-w-44 max-xl:hidden">
                <div className="flex items-center gap-2">
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-secondary text-[10px] font-semibold">
                      {deal.ownerInitials}
                    </AvatarFallback>
                  </Avatar>
                  <InlineSelectField
                    value={deal.ownerId ?? 'unassigned'}
                    onValueChange={(value) =>
                      updateDealOwner(deal.id, value === 'unassigned' ? null : value)
                    }
                    disabled={isRowPending}
                    className="w-full"
                    testId={`deal-owner-${deal.id}`}
                    ariaLabel={`${deal.title} sorumlusunu degistir`}
                    options={[
                      { value: 'unassigned', label: 'Atanmamis' },
                      ...users.map((user) => ({ value: user.id, label: user.name })),
                    ]}
                  />
                </div>
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground max-sm:hidden">
                {formatDate(deal.expectedCloseAt)}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
