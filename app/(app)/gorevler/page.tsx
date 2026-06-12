import { PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getTasksPageData } from '@/lib/crm/queries'
import { formatDate } from '@/lib/format'
import { priorityMeta, taskPriorityLabels, taskStatusLabels, taskStatusMeta } from '@/lib/ui-meta'

export default async function TasksPage() {
  const tasks = await getTasksPageData()
  const openCount = tasks.filter((task) => task.status !== 'DONE').length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gorevler"
        description={`${openCount} acik gorev · ekibinizin yapilacak listesi`}
        actions={
          <Button
            nativeButton={false}
            render={
              <Link href="/gorevler?quickCreate=task">
                <PlusIcon data-icon="inline-start" />
                Yeni Gorev
              </Link>
            }
          />
        }
      />

      <Card>
        <CardContent className="flex flex-col p-0">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className={`flex flex-wrap items-center gap-4 px-4 py-3 ${index !== tasks.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-foreground">
                  {task.title}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {task.related} · Son tarih {formatDate(task.dueAt)}
                </span>
              </div>
              <Badge variant={priorityMeta[task.priority].variant}>
                {taskPriorityLabels[task.priority]}
              </Badge>
              <Badge variant={taskStatusMeta[task.status].variant}>
                {taskStatusLabels[task.status]}
              </Badge>
              <Avatar className="size-7">
                <AvatarFallback className="text-[10px]">
                  {task.assigneeInitials}
                </AvatarFallback>
              </Avatar>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
