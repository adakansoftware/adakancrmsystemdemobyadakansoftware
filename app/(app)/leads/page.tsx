import { Download, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { SummaryCard } from '@/components/shared/summary-card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getLeadsPageData } from '@/lib/crm/queries'
import { formatCurrency } from '@/lib/format'
import { getInitials } from '@/lib/helpers'
import {
  leadSourceLabels,
  leadStatusLabels,
  leadStatusMeta,
  leadTemperatureLabels,
} from '@/lib/ui-meta'

export default async function LeadsPage() {
  const leads = await getLeadsPageData()

  return (
    <>
      <PageHeader
        title="Leads"
        description="Potansiyel müşterileri gerçek CRM kayıtlarından takip edin"
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
          label="Açık"
          value={leads.filter((lead) => lead.status === 'OPEN').length}
          badge="Durum"
          badgeVariant="info"
        />
        <SummaryCard
          label="Nitelikli"
          value={leads.filter((lead) => lead.status === 'QUALIFIED').length}
          badge="Durum"
          badgeVariant="success"
        />
        <SummaryCard
          label="Tahmini Değer"
          value={formatCurrency(
            leads.reduce((sum, lead) => sum + lead.estimatedValue, 0),
          )}
          badge="TRY"
          badgeVariant="warning"
        />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead className="max-lg:hidden">Firma / Kişi</TableHead>
                <TableHead>Kaynak</TableHead>
                <TableHead>Sıcaklık</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right max-md:hidden">Değer</TableHead>
                <TableHead className="max-xl:hidden">Sorumlu</TableHead>
                <TableHead className="max-lg:hidden">Aşama</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
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
                  <TableCell>
                    <Badge variant={leadStatusMeta[lead.status].variant}>
                      {leadStatusLabels[lead.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium max-md:hidden">
                    {formatCurrency(lead.estimatedValue)}
                  </TableCell>
                  <TableCell className="max-xl:hidden">{lead.owner}</TableCell>
                  <TableCell className="max-lg:hidden">{lead.stage}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  )
}
