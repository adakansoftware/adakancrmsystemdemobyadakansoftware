import { PlusIcon } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCalendarPageData } from '@/lib/crm/queries'
import { formatDateTime } from '@/lib/format'

export default async function CalendarPage() {
  const data = await getCalendarPageData()
  const events = [...data.tasks, ...data.deals].sort(
    (left, right) => left.date.getTime() - right.date.getTime(),
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Takvim"
        description="Yaklaşan görevler ve anlaşma kapanış tarihleri"
        actions={
          <Button>
            <PlusIcon data-icon="inline-start" />
            Etkinlik Ekle
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Yaklaşan plan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {events.slice(0, 12).map((event) => (
              <div key={`${event.type}-${event.id}`} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={event.type === 'TASK' ? 'warning' : 'info'}>
                    {event.type === 'TASK' ? 'Görev' : 'Deal Kapanışı'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(event.date)}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium">{event.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{event.with}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yaklaşan detay listesi</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {events.map((event) => (
              <div
                key={`side-${event.type}-${event.id}`}
                className="flex flex-col gap-1 rounded-lg border border-border p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {formatDateTime(event.date)}
                  </span>
                  <Badge variant={event.type === 'TASK' ? 'warning' : 'info'}>
                    {event.type === 'TASK' ? 'Görev' : 'Deal'}
                  </Badge>
                </div>
                <span className="text-sm text-foreground">{event.title}</span>
                <span className="text-xs text-muted-foreground">{event.with}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
