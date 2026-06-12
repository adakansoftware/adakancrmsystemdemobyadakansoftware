import { FileText, Wrench } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function QuotesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Teklifler"
        description="Bu modül MVP kapsamı dışında tutuldu"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Teklif Modülü Hazır Değil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Bu depo şu anda CRM çekirdeğine odaklanıyor: kimlik doğrulama, şirket,
            kişi, lead, deal, görev, pipeline ve not/aktivite akışı.
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="warning">
              <Wrench className="size-3.5" />
              Bilerek ertelendi
            </Badge>
            <span>Teklif yönetimi sonraki fazda ele alınacak.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
