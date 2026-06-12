'use client'

import { useState } from 'react'
import {
  Download,
  FileText,
  Filter,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { SummaryCard } from '@/components/shared/summary-card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  formatCurrency,
  leads,
  leadSources,
  leadStatuses,
  leadStatusMeta,
  type LeadSource,
  type LeadStatus,
} from '@/lib/data'
import { getInitials, matchesQuery } from '@/lib/helpers'

type LeadStatusFilter = LeadStatus | 'all'
type LeadSourceFilter = LeadSource | 'all'

export default function LeadsPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<LeadStatusFilter>('all')
  const [source, setSource] = useState<LeadSourceFilter>('all')

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = status === 'all' || lead.status === status
    const matchesSource = source === 'all' || lead.source === source

    return (
      matchesStatus &&
      matchesSource &&
      matchesQuery([lead.name, lead.company, lead.id], query)
    )
  })

  return (
    <>
      <PageHeader
        title="Leads"
        description="Potansiyel müşterilerinizi takip edin ve yönetin"
      >
        <Button variant="outline">
          <Download data-icon="inline-start" />
          Dışa Aktar
        </Button>
        <Button>
          <Plus data-icon="inline-start" />
          Yeni Lead
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Toplam Lead" value={leads.length} badge="Lead" badgeVariant="info" />
        <SummaryCard
          label="Yeni"
          value={leads.filter((lead) => lead.status === 'Yeni').length}
          badge="Lead"
          badgeVariant="info"
        />
        <SummaryCard
          label="Teklif Verildi"
          value={leads.filter((lead) => lead.status === 'Teklif Verildi').length}
          badge="Lead"
          badgeVariant="warning"
        />
        <SummaryCard
          label="Kazanıldı"
          value={leads.filter((lead) => lead.status === 'Kazanıldı').length}
          badge="Lead"
          badgeVariant="success"
        />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="İsim, firma veya ID ara..."
            className="flex-1"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as LeadStatusFilter)}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="size-4 text-muted-foreground" />
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  {leadStatuses.map((leadStatus) => (
                    <SelectItem key={leadStatus} value={leadStatus}>
                      {leadStatus}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={source}
              onValueChange={(value) => setSource(value as LeadSourceFilter)}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Kaynak" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tüm Kaynaklar</SelectItem>
                  {leadSources.map((leadSource) => (
                    <SelectItem key={leadSource} value={leadSource}>
                      {leadSource}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Filter />
              </EmptyMedia>
              <EmptyTitle>Sonuç bulunamadı</EmptyTitle>
              <EmptyDescription>
                Arama kriterlerinize uygun lead bulunamadı. Filtreleri
                değiştirmeyi deneyin.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead className="max-lg:hidden">Kaynak</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right max-md:hidden">Değer</TableHead>
                  <TableHead className="max-xl:hidden">Sorumlu</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-primary/12 text-xs font-semibold text-primary">
                            {getInitials(lead.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{lead.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {lead.company}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-lg:hidden">
                      <Badge variant="outline">{lead.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={leadStatusMeta[lead.status].variant}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium max-md:hidden">
                      {formatCurrency(lead.value)}
                    </TableCell>
                    <TableCell className="max-xl:hidden text-sm text-muted-foreground">
                      {lead.owner}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                  toast('Arama başlatıldı', {
                                    description: lead.phone,
                                  })
                                }
                                aria-label={`${lead.name} kişisini ara`}
                              >
                                <Phone />
                              </Button>
                            }
                          />
                          <TooltipContent>Ara</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                  toast('WhatsApp açılıyor', {
                                    description: lead.name,
                                  })
                                }
                                aria-label={`${lead.name} için WhatsApp aç`}
                              >
                                <MessageCircle />
                              </Button>
                            }
                          />
                          <TooltipContent>WhatsApp</TooltipContent>
                        </Tooltip>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label={`${lead.name} için daha fazla işlem`}
                              >
                                <MoreHorizontal />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                onClick={() => toast.success('Teklif oluşturuldu')}
                              >
                                <FileText />
                                Teklif Oluştur
                              </DropdownMenuItem>
                              <DropdownMenuItem>Düzenle</DropdownMenuItem>
                              <DropdownMenuItem>Müşteriye Çevir</DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </>
  )
}
