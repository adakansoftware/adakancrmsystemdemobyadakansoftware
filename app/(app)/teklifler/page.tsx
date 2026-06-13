import { FileText, Wrench } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function QuotesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Teklifler"
        description="Bu modul MVP kapsami disinda tutuldu"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Teklif Modulu Hazir Degil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Bu depo su anda CRM cekirdegine odaklaniyor: kimlik dogrulama, sirket,
            kisi, lead, deal, gorev, pipeline ve not/aktivite akisleri.
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="warning">
              <Wrench className="size-3.5" />
              Bilerek ertelendi
            </Badge>
            <span>Teklif yonetimi sonraki fazda ele alinacak.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
