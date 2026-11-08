'use client'

import { updateLeadAction } from '@/app/actions/crm'
import { InlineSelectField } from '@/components/crm/inline-select-field'
import { useEnumLabels } from '@/components/i18n/locale-provider'
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
import { useOptimisticRowAction } from '@/hooks/use-optimistic-row-action'
import { type AssignableUsersData, type LeadsPageData } from '@/lib/crm/queries'
import { leadStatuses } from '@/lib/crm/view-models'
import { formatCurrency } from '@/lib/format'
import { getInitials } from '@/lib/helpers'

export function LeadsTableClient({
  leads,
  users,
}: {
  leads: LeadsPageData
  users: AssignableUsersData
}) {
  const { runRowAction, isRowPending } = useOptimisticRowAction<string>()
  const labels = useEnumLabels()

  function updateLead(
    leadId: string,
    payload: { status?: LeadsPageData[number]['status']; ownerId?: string | null },
    successMessage: string,
  ) {
    runRowAction(
      leadId,
      () =>
        updateLeadAction({
          id: leadId,
          ...payload,
        }),
      {
        successMessage,
        errorMessage: 'Lead guncellemesi basarisiz',
      },
    )
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
          const rowPending = isRowPending(lead.id)

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
                <Badge variant="outline">{labels.leadSource[lead.source]}</Badge>
              </TableCell>
              <TableCell>{labels.leadTemperature[lead.temperature]}</TableCell>
              <TableCell className="min-w-40">
                <InlineSelectField
                  value={lead.status}
                  onValueChange={(value) =>
                    updateLead(lead.id, { status: value }, 'Lead durumu guncellendi')
                  }
                  disabled={rowPending}
                  testId={`lead-status-${lead.id}`}
                  ariaLabel={`${lead.title} durumunu degistir`}
                  options={leadStatuses.map((status) => ({
                    value: status,
                    label: labels.leadStatus[status],
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
                  disabled={rowPending}
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
