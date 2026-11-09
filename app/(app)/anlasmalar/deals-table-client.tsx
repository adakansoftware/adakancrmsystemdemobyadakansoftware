'use client'

import Link from 'next/link'
import { moveDealToStageAction, updateDealAction } from '@/app/actions/crm'
import { InlineSelectField } from '@/components/crm/inline-select-field'
import { useEnumLabels, useI18n } from '@/components/i18n/locale-provider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useOptimisticRowAction } from '@/hooks/use-optimistic-row-action'
import { type AssignableUsersData, type DealsPageData } from '@/lib/crm/queries'
import { dealStatuses } from '@/lib/crm/view-models'
import { formatCurrency, formatDate } from '@/lib/format'

export function DealsTableClient({
  deals,
  users,
}: {
  deals: DealsPageData
  users: AssignableUsersData
}) {
  const { runRowAction, isRowPending } = useOptimisticRowAction<string>()
  const labels = useEnumLabels()
  const { t } = useI18n()

  function updateDealOwner(dealId: string, ownerId: string | null) {
    runRowAction(dealId, () => updateDealAction({ id: dealId, ownerId }), {
      successMessage: t('deals.ownerUpdated'),
      errorMessage: t('deals.updateFailed'),
    })
  }

  function updateDealStage(deal: DealsPageData[number], stageId: string) {
    runRowAction(
      deal.id,
      () =>
        moveDealToStageAction({
          dealId: deal.id,
          toPipelineId: deal.pipelineId,
          toStageId: stageId,
        }),
      {
        successMessage: t('deals.stageUpdated'),
        errorMessage: t('deals.stageChangeFailed'),
      },
    )
  }

  function updateDealStatus(deal: DealsPageData[number], status: DealsPageData[number]['status']) {
    runRowAction(
      deal.id,
      async () => {
        if (status === 'ABANDONED') {
          return updateDealAction({ id: deal.id, status })
        }

        const targetStage =
          status === 'OPEN'
            ? deal.availableStages.find((stage) => !stage.isClosed)
            : deal.availableStages.find((stage) =>
                status === 'WON' ? stage.isClosed && stage.isWon : stage.isClosed && !stage.isWon,
              )

        if (!targetStage) {
          throw new Error(t('deals.noStageForStatus'))
        }

        return moveDealToStageAction({
          dealId: deal.id,
          toPipelineId: deal.pipelineId,
          toStageId: targetStage.id,
        })
      },
      {
        successMessage: t('deals.statusUpdated'),
        errorMessage: t('deals.statusChangeFailed'),
      },
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('deals.colDeal')}</TableHead>
          <TableHead className="max-lg:hidden">{t('common.colCompanyContact')}</TableHead>
          <TableHead className="min-w-40">{t('common.colStatus')}</TableHead>
          <TableHead className="min-w-44 max-lg:hidden">{t('common.colStage')}</TableHead>
          <TableHead className="text-right">{t('common.colAmount')}</TableHead>
          <TableHead className="text-right max-md:hidden">{t('common.colProbability')}</TableHead>
          <TableHead className="min-w-44 max-xl:hidden">{t('common.colOwner')}</TableHead>
          <TableHead className="text-right max-sm:hidden">{t('common.colClose')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deals.map((deal) => {
          const rowPending = isRowPending(deal.id)

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
                  disabled={rowPending}
                  testId={`deal-status-${deal.id}`}
                  ariaLabel={t('deals.changeStatusAria', { title: deal.title })}
                  options={dealStatuses.map((status) => ({
                    value: status,
                    label: labels.dealStatus[status],
                  }))}
                />
              </TableCell>
              <TableCell className="min-w-44 max-lg:hidden">
                <InlineSelectField
                  value={deal.stageId}
                  onValueChange={(value) => updateDealStage(deal, value)}
                  disabled={rowPending}
                  testId={`deal-stage-${deal.id}`}
                  ariaLabel={t('deals.changeStageAria', { title: deal.title })}
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
                    disabled={rowPending}
                    className="w-full"
                    testId={`deal-owner-${deal.id}`}
                    ariaLabel={t('deals.changeOwnerAria', { title: deal.title })}
                    options={[
                      { value: 'unassigned', label: t('common.unassigned') },
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
