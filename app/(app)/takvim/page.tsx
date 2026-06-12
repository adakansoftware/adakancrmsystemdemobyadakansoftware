'use client'

import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  calendarEventMeta,
  calendarEvents,
  type CalendarEvent,
} from '@/lib/data'
import { cn } from '@/lib/utils'

const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const firstWeekday = 0
const daysInMonth = 30
const today = 12

const calendarCells: Array<number | null> = [
  ...Array.from({ length: firstWeekday }, () => null),
  ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
]

while (calendarCells.length % 7 !== 0) {
  calendarCells.push(null)
}

const eventsByDay = calendarEvents.reduce<Map<number, CalendarEvent[]>>(
  (map, event) => {
    map.set(event.day, [...(map.get(event.day) ?? []), event])
    return map
  },
  new Map(),
)

export default function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState(today)
  const selectedEvents = eventsByDay.get(selectedDay) ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Takvim"
        description="Haziran 2026 · toplantılar, aramalar ve son tarihler"
        actions={
          <Button>
            <PlusIcon data-icon="inline-start" />
            Etkinlik Ekle
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Haziran 2026</CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" aria-label="Önceki ay">
                <ChevronLeftIcon />
              </Button>
              <Button variant="outline" size="icon" aria-label="Sonraki ay">
                <ChevronRightIcon />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px border-b border-border pb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 pt-2">
              {calendarCells.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="min-h-20" />
                }

                const dayEvents = eventsByDay.get(day) ?? []
                const isToday = day === today
                const isSelected = day === selectedDay

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      'flex min-h-20 flex-col gap-1 rounded-lg border border-transparent p-1.5 text-left transition-colors hover:bg-accent',
                      isSelected && 'border-primary bg-accent',
                    )}
                    aria-pressed={isSelected}
                    aria-label={`${day} Haziran için ${dayEvents.length} etkinlik`}
                  >
                    <span
                      className={cn(
                        'flex size-6 items-center justify-center rounded-full text-xs font-medium',
                        isToday
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground',
                      )}
                    >
                      {day}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {dayEvents.slice(0, 2).map((event) => (
                        <span
                          key={event.id}
                          className="flex items-center gap-1 truncate text-[10px] text-muted-foreground"
                        >
                          <span
                            className={cn(
                              'size-1.5 shrink-0 rounded-full',
                              calendarEventMeta[event.type].dot,
                            )}
                          />
                          <span className="truncate">{event.title}</span>
                        </span>
                      ))}
                      {dayEvents.length > 2 ? (
                        <span className="text-[10px] text-muted-foreground">
                          +{dayEvents.length - 2} daha
                        </span>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedDay} Haziran etkinlikleri</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Bu gün için planlanmış etkinlik yok.
              </p>
            ) : (
              selectedEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-1 rounded-lg border border-border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {event.time}
                    </span>
                    <Badge variant={calendarEventMeta[event.type].variant}>
                      {event.type}
                    </Badge>
                  </div>
                  <span className="text-sm text-foreground">{event.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {event.with}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
