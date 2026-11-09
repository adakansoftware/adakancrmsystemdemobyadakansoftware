'use client'

import { useState } from 'react'
import { moveDealToStageAction, updateDealAction } from '@/app/actions/crm'
import { InlineSelectField } from '@/components/crm/inline-select-field'
import { useEnumLabels, useI18n } from '@/components/i18n/locale-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useServerActionToast } from '@/hooks/use-server-action-toast'
import { formatCurrency } from '@/lib/format'
import { dealStatuses, type UserOption } from '@/lib/crm/view-models'

export function DealDetailClient({
  deal,
  users,
}: {
  deal: {
    id: string
    title: string
    amount: number
    currency: string
    status: 'OPEN' | 'WON' | 'LOST' | 'ABANDONED'
    probability: number
    expectedCloseAt: Date | null
    pipelineId: string
    stageId: string
    ownerId?: string | null
    pipeline: {
      stages: Array<{
        id: string
        name: string
        isClosed: boolean
        isWon: boolean
      }>
    }
  }
  users: UserOption[]
}) {
  const { isPending, runServerAction } = useServerActionToast()
  const labels = useEnumLabels()
  const { t } = useI18n()
  const [title, setTitle] = useState(deal.title)
  const [amount, setAmount] = useState(String(deal.amount))
  const [ownerId, setOwnerId] = useState(deal.ownerId ?? 'unassigned')
  const [status, setStatus] = useState(deal.status)
  const [stageId, setStageId] = useState(deal.stageId)

  function persistCoreFields() {
    runServerAction(
      () =>
        updateDealAction({
          id: deal.id,
          title,
          amount: Number(amount),
          ownerId: ownerId === 'unassigned' ? null : ownerId,
          status,
        }),
      {
        successMessage: t('dealDetail.updated'),
        errorMessage: t('dealDetail.updateFailed'),
      },
    )
  }

  function moveStage(nextStageId: string) {
    setStageId(nextStageId)

    runServerAction(
      () =>
        moveDealToStageAction({
          dealId: deal.id,
          toPipelineId: deal.pipelineId,
          toStageId: nextStageId,
        }),
      {
        successMessage: t('dealDetail.stageUpdated'),
        errorMessage: t('dealDetail.stageUpdateFailed'),
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dealDetail.info')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="space-y-1.5 text-sm">
          <span>{t('common.colTitle')}</span>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="space-y-1.5 text-sm">
          <span>{t('common.colAmount')}</span>
          <Input value={amount} onChange={(event) => setAmount(event.target.value)} />
          <span className="text-xs text-muted-foreground">
            {t('dealDetail.currentView', { value: formatCurrency(Number(amount || 0), deal.currency) })}
          </span>
        </label>
        <div className="space-y-1.5 text-sm">
          <span>{t('common.colStatus')}</span>
          <InlineSelectField
            value={status}
            onValueChange={(value) => setStatus(value as typeof status)}
            ariaLabel={t('dealDetail.statusAria')}
            options={dealStatuses.map((currentStatus) => ({
              value: currentStatus,
              label: labels.dealStatus[currentStatus],
            }))}
          />
        </div>
        <div className="space-y-1.5 text-sm">
          <span>{t('common.colStage')}</span>
          <InlineSelectField
            value={stageId}
            onValueChange={moveStage}
            ariaLabel={t('dealDetail.stageAria')}
            options={deal.pipeline.stages.map((stage) => ({
              value: stage.id,
              label: stage.name,
            }))}
          />
        </div>
        <div className="space-y-1.5 text-sm">
          <span>{t('common.colOwner')}</span>
          <InlineSelectField
            value={ownerId}
            onValueChange={setOwnerId}
            ariaLabel={t('dealDetail.ownerAria')}
            options={[
              { value: 'unassigned', label: t('common.unassigned') },
              ...users.map((user) => ({ value: user.id, label: user.name })),
            ]}
          />
        </div>

        <Button onClick={persistCoreFields} disabled={isPending} className="w-full">
          {isPending ? t('common.saving') : t('common.saveChanges')}
        </Button>
      </CardContent>
    </Card>
  )
}
