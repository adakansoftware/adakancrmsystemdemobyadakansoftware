'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateLeadAction } from '@/app/actions/crm'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
import { formatCurrency } from '@/lib/format'
import { getInitials } from '@/lib/helpers'
import {
  leadSourceLabels,
  leadStatusLabels,
  leadTemperatureLabels,
} from '@/lib/ui-meta'

const leadStatuses = ['OPEN', 'QUALIFIED', 'DISQUALIFIED', 'CONVERTED', 'LOST'] as const

type LeadRow = {
  id: string
  title: string
  company: string
  contact: string
  source: keyof typeof leadSourceLabels
  temperature: keyof typeof leadTemperatureLabels
  status: (typeof leadStatuses)[number]
  estimatedValue: number
  ownerId?: string | null
  owner: string
  stage: string
}

type UserOption = {
  id: string
  name: string
}

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
                <Select
                  value={lead.status}
                  onValueChange={(value) =>
                    value &&
                    updateLead(
                      lead.id,
                      { status: value as LeadRow['status'] },
                      'Lead durumu guncellendi',
                    )
                  }
                  disabled={isRowPending}
                >
                  <SelectTrigger size="sm" className="w-full" data-testid={`lead-status-${lead.id}`}>
                    <SelectValue>{leadStatusLabels[lead.status]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {leadStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {leadStatusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right font-medium max-md:hidden">
                {formatCurrency(lead.estimatedValue)}
              </TableCell>
              <TableCell className="min-w-44">
                <Select
                  value={lead.ownerId ?? 'unassigned'}
                  onValueChange={(value) =>
                    updateLead(
                      lead.id,
                      { ownerId: value === 'unassigned' ? null : value },
                      'Lead sorumlusu guncellendi',
                    )
                  }
                  disabled={isRowPending}
                >
                  <SelectTrigger size="sm" className="w-full" data-testid={`lead-owner-${lead.id}`}>
                    <SelectValue>{lead.ownerId ? lead.owner : 'Atanmamis'}</SelectValue>
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
              </TableCell>
              <TableCell className="max-lg:hidden">{lead.stage}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
