'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { moveDealToStageAction, updateDealAction } from '@/app/actions/crm'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/format'
import { dealStatusLabels } from '@/lib/ui-meta'

const dealStatuses = ['OPEN', 'WON', 'LOST', 'ABANDONED'] as const

type DealRow = {
  id: string
  title: string
  company: string
  contact: string
  amount: number
  currency: string
  status: (typeof dealStatuses)[number]
  probability: number
  expectedCloseAt: Date | null
  ownerId?: string | null
  owner: string
  ownerInitials: string
  stage: string
  stageId: string
  pipelineId: string
  availableStages: Array<{
    id: string
    name: string
    isClosed: boolean
    isWon: boolean
  }>
}

type UserOption = {
  id: string
  name: string
}

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
                  <span className="font-medium">{deal.title}</span>
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
                <Select
                  value={deal.status}
                  onValueChange={(value) => value && updateDealStatus(deal, value as DealRow['status'])}
                  disabled={isRowPending}
                >
                  <SelectTrigger size="sm" className="w-full" data-testid={`deal-status-${deal.id}`}>
                    <SelectValue>{dealStatusLabels[deal.status]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {dealStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {dealStatusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="min-w-44 max-lg:hidden">
                <Select
                  value={deal.stageId}
                  onValueChange={(value) => value && updateDealStage(deal, value)}
                  disabled={isRowPending}
                >
                  <SelectTrigger size="sm" className="w-full" data-testid={`deal-stage-${deal.id}`}>
                    <SelectValue>{deal.stage}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {deal.availableStages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
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
                  <Select
                    value={deal.ownerId ?? 'unassigned'}
                    onValueChange={(value) =>
                      updateDealOwner(deal.id, value === 'unassigned' ? null : value)
                    }
                    disabled={isRowPending}
                  >
                    <SelectTrigger size="sm" className="w-full" data-testid={`deal-owner-${deal.id}`}>
                      <SelectValue>{deal.ownerId ? deal.owner : 'Atanmamis'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="unassigned">Atanmamis</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
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
