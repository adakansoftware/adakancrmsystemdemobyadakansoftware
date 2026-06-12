'use client'

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  priorityMeta,
  tasks as seedTasks,
  taskStatusMeta,
  type Task,
  type TaskStatus,
} from '@/lib/data'
import { cn } from '@/lib/utils'

const statusOrder: TaskStatus[] = ['Bekliyor', 'Devam Ediyor', 'Tamamlandı']

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(seedTasks)
  const [filter, setFilter] = useState<'all' | 'mine'>('all')

  const visibleTasks =
    filter === 'mine'
      ? tasks.filter((task) => task.assignee === 'Elif Yılmaz')
      : tasks

  function toggleTask(id: string) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id
          ? {
              ...task,
              status: task.status === 'Tamamlandı' ? 'Bekliyor' : 'Tamamlandı',
            }
          : task,
      ),
    )
  }

  const openCount = tasks.filter((task) => task.status !== 'Tamamlandı').length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Görevler"
        description={`${openCount} açık görev · ekibinizin yapılacaklar listesi`}
        actions={
          <Button>
            <PlusIcon data-icon="inline-start" />
            Yeni Görev
          </Button>
        }
      />

      <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'mine')}>
        <TabsList>
          <TabsTrigger value="all">Tüm Görevler</TabsTrigger>
          <TabsTrigger value="mine">Bana Atananlar</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6 flex flex-col gap-6">
          {statusOrder.map((status) => {
            const group = visibleTasks.filter((task) => task.status === status)

            if (group.length === 0) {
              return null
            }

            return (
              <section key={status} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    {status}
                  </h2>
                  <Badge variant="secondary">{group.length}</Badge>
                </div>
                <Card>
                  <CardContent className="flex flex-col p-0">
                    {group.map((task, index) => {
                      const done = task.status === 'Tamamlandı'

                      return (
                        <div
                          key={task.id}
                          className={cn(
                            'flex flex-wrap items-center gap-4 px-4 py-3',
                            index !== group.length - 1 && 'border-b border-border',
                          )}
                        >
                          <Checkbox
                            checked={done}
                            onCheckedChange={() => toggleTask(task.id)}
                            aria-label={`${task.title} tamamlandı olarak işaretle`}
                          />
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span
                              className={cn(
                                'truncate text-sm font-medium text-foreground',
                                done && 'text-muted-foreground line-through',
                              )}
                            >
                              {task.title}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {task.related} · Son tarih {task.dueDate}
                            </span>
                          </div>
                          <Badge variant={priorityMeta[task.priority].variant}>
                            {task.priority}
                          </Badge>
                          <Badge variant={taskStatusMeta[task.status].variant}>
                            {task.status}
                          </Badge>
                          <Avatar className="size-7">
                            <AvatarFallback className="text-[10px]">
                              {task.assigneeInitials}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </section>
            )
          })}
        </TabsContent>
      </Tabs>
    </div>
  )
}
