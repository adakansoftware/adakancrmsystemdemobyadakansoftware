'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateLeadAction } from '@/app/actions/crm'
import { InlineSelectField } from '@/components/crm/inline-select-field'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { leadStatuses, type LeadRow, type UserOption } from '@/lib/crm/view-models'
import { formatCurrency } from '@/lib/format'
import { getInitials } from '@/lib/helpers'
import {
  leadSourceLabels,
  leadStatusLabels,
  leadTemperatureLabels,
} from '@/lib/ui-meta'

export function LeadsTableClient({
  leads,
  users,
}: {
  leads: LeadRow[]
  users: UserOption[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingLeadId, setPendingLeadId] = useState<string | null>(null)

  function updateLead(
    leadId: string,
    payload: { status?: LeadRow['status']; ownerId?: string | null },
    successMessage: string,
  ) {
    startTransition(async () => {
      try {
        setPendingLeadId(leadId)
        const result = await updateLeadAction({
          id: leadId,
          ...payload,
        })

        if (!result.success) {
          throw new Error('Lead guncellenemedi')
        }

        toast.success(successMessage)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Lead guncellemesi basarisiz')
      } finally {
        setPendingLeadId(null)
      }
    })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lead</TableHead>
          <TableHead className="max-lg:hidden">Firma / Kisi</TableHead>
          <TableHead>Kaynak</TableHead>
          <TableHead>Sicaklik</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead className="text-right max-md:hidden">Deger</TableHead>
          <TableHead className="min-w-44">Sorumlu</TableHead>
          <TableHead className="max-lg:hidden">Asama</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => {
          const isRowPending = isPending && pendingLeadId === lead.id

          return (
            <TableRow key={lead.id} data-testid={`lead-row-${lead.id}`}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-primary/12 text-xs font-semibold text-primary">
                      {getInitials(lead.title)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{lead.title}</span>
                    <span className="text-xs text-muted-foreground">{lead.id}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="max-lg:hidden">
                <div className="flex flex-col">
                  <span>{lead.company}</span>
                  <span className="text-xs text-muted-foreground">{lead.contact}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{leadSourceLabels[lead.source]}</Badge>
              </TableCell>
              <TableCell>{leadTemperatureLabels[lead.temperature]}</TableCell>
              <TableCell className="min-w-40">
                <InlineSelectField
                  value={lead.status}
                  onValueChange={(value) =>
                    updateLead(lead.id, { status: value }, 'Lead durumu guncellendi')
                  }
                  disabled={isRowPending}
                  testId={`lead-status-${lead.id}`}
                  ariaLabel={`${lead.title} durumunu degistir`}
                  options={leadStatuses.map((status) => ({
                    value: status,
                    label: leadStatusLabels[status],
                  }))}
                />
              </TableCell>
              <TableCell className="text-right font-medium max-md:hidden">
                {formatCurrency(lead.estimatedValue)}
              </TableCell>
              <TableCell className="min-w-44">
                <InlineSelectField
                  value={lead.ownerId ?? 'unassigned'}
                  onValueChange={(value) =>
                    updateLead(
                      lead.id,
                      { ownerId: value === 'unassigned' ? null : value },
                      'Lead sorumlusu guncellendi',
                    )
                  }
                  disabled={isRowPending}
                  testId={`lead-owner-${lead.id}`}
                  ariaLabel={`${lead.title} sorumlusunu degistir`}
                  options={[
                    { value: 'unassigned', label: 'Atanmamis' },
                    ...users.map((user) => ({ value: user.id, label: user.name })),
                  ]}
                />
              </TableCell>
              <TableCell className="max-lg:hidden">{lead.stage}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
