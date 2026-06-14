'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { moveDealToStageAction, updateDealAction } from '@/app/actions/crm'
import { InlineSelectField } from '@/components/crm/inline-select-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/format'
import { dealStatusLabels } from '@/lib/ui-meta'
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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(deal.title)
  const [amount, setAmount] = useState(String(deal.amount))
  const [ownerId, setOwnerId] = useState(deal.ownerId ?? 'unassigned')
  const [status, setStatus] = useState(deal.status)
  const [stageId, setStageId] = useState(deal.stageId)

  function persistCoreFields() {
    startTransition(async () => {
      try {
        const result = await updateDealAction({
          id: deal.id,
          title,
          amount: Number(amount),
          ownerId: ownerId === 'unassigned' ? null : ownerId,
          status,
        })

        if (!result.success) {
          throw new Error('Deal bilgileri kaydedilemedi')
        }

        toast.success('Deal bilgileri guncellendi')
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Deal guncellenemedi')
      }
    })
  }

  function moveStage(nextStageId: string) {
    setStageId(nextStageId)

    startTransition(async () => {
      try {
        const result = await moveDealToStageAction({
          dealId: deal.id,
          toPipelineId: deal.pipelineId,
          toStageId: nextStageId,
        })

        if (!result.success) {
          throw new Error('Asama guncellenemedi')
        }

        toast.success('Deal asamasi guncellendi')
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Asama guncellenemedi')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Bilgileri</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="space-y-1.5 text-sm">
          <span>Baslik</span>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="space-y-1.5 text-sm">
          <span>Tutar</span>
          <Input value={amount} onChange={(event) => setAmount(event.target.value)} />
          <span className="text-xs text-muted-foreground">
            Guncel gorunum: {formatCurrency(Number(amount || 0), deal.currency)}
          </span>
        </label>
        <div className="space-y-1.5 text-sm">
          <span>Durum</span>
          <InlineSelectField
            value={status}
            onValueChange={(value) => setStatus(value as typeof status)}
            ariaLabel="Deal durumu"
            options={dealStatuses.map((currentStatus) => ({
              value: currentStatus,
              label: dealStatusLabels[currentStatus],
            }))}
          />
        </div>
        <div className="space-y-1.5 text-sm">
          <span>Asama</span>
          <InlineSelectField
            value={stageId}
            onValueChange={moveStage}
            ariaLabel="Deal asamasi"
            options={deal.pipeline.stages.map((stage) => ({
              value: stage.id,
              label: stage.name,
            }))}
          />
        </div>
        <div className="space-y-1.5 text-sm">
          <span>Sorumlu</span>
          <InlineSelectField
            value={ownerId}
            onValueChange={setOwnerId}
            ariaLabel="Deal sorumlusu"
            options={[
              { value: 'unassigned', label: 'Atanmamis' },
              ...users.map((user) => ({ value: user.id, label: user.name })),
            ]}
          />
        </div>

        <Button onClick={persistCoreFields} disabled={isPending} className="w-full">
          {isPending ? 'Kaydediliyor...' : 'Degisiklikleri Kaydet'}
        </Button>
      </CardContent>
    </Card>
  )
}
