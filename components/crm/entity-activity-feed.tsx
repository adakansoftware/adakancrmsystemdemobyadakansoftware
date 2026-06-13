import { CalendarClock, FileText, ListTodo, MessageSquare, Phone, Settings2, Trophy, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/format'
import { activityTypeMeta } from '@/lib/ui-meta'
import type { EntityActivityViewModel } from '@/lib/crm/view-models'

const activityIcons = {
  CALL: Phone,
  EMAIL: FileText,
  MEETING: CalendarClock,
  NOTE: FileText,
  TASK: ListTodo,
  STATUS_CHANGE: Settings2,
  STAGE_CHANGE: TrendingUp,
  COMMENT: MessageSquare,
  SYSTEM: Trophy,
} as const

export function EntityActivityFeed({
  activities,
  emptyLabel,
}: {
  activities: EntityActivityViewModel[]
  emptyLabel: string
}) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.type]

        return (
          <div key={activity.id} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{activity.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.actorName} · {formatDateTime(activity.occurredAt)}
                  </p>
                  {activity.description ? (
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  ) : null}
                </div>
              </div>
              <Badge variant={activityTypeMeta[activity.type].variant}>
                {activityTypeMeta[activity.type].label}
              </Badge>
            </div>
          </div>
        )
      })}
    </div>
  )
}
