'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateTaskAction } from '@/app/actions/crm'
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
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/format'
import { priorityMeta, taskPriorityLabels, taskStatusLabels } from '@/lib/ui-meta'

const taskStatuses = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELED'] as const

type TaskRow = {
  id: string
  title: string
  related: string
  priority: keyof typeof taskPriorityLabels
  status: (typeof taskStatuses)[number]
  dueAt: Date | null
  assigneeId?: string | null
  assigneeInitials: string
}

type UserOption = {
  id: string
  name: string
}

export function TasksListClient({
  tasks,
  users,
}: {
  tasks: TaskRow[]
  users: UserOption[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)

  function updateTask(
    taskId: string,
    payload: { status?: TaskRow['status']; assigneeId?: string | null },
    successMessage: string,
  ) {
    startTransition(async () => {
      try {
        setPendingTaskId(taskId)
        const result = await updateTaskAction({
          id: taskId,
          ...payload,
        })

        if (!result.success) {
          throw new Error('Gorev guncellenemedi')
        }

        toast.success(successMessage)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Gorev guncellemesi basarisiz')
      } finally {
        setPendingTaskId(null)
      }
    })
  }

  return (
    <Card>
      <CardContent className="flex flex-col p-0">
        {tasks.map((task, index) => {
          const isRowPending = isPending && pendingTaskId === task.id

          return (
            <div
              key={task.id}
              data-testid={`task-row-${task.id}`}
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
              <Select
                value={task.status}
                onValueChange={(value) =>
                  value &&
                  updateTask(
                    task.id,
                    { status: value as TaskRow['status'] },
                    'Gorev durumu guncellendi',
                  )
                }
                disabled={isRowPending}
              >
                <SelectTrigger size="sm" className="w-40" data-testid={`task-status-${task.id}`}>
                  <SelectValue>{taskStatusLabels[task.status]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {taskStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {taskStatusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <div className="flex min-w-44 items-center gap-2">
                <Avatar className="size-7">
                  <AvatarFallback className="text-[10px]">
                    {task.assigneeInitials}
                  </AvatarFallback>
                </Avatar>
                <Select
                  value={task.assigneeId ?? 'unassigned'}
                  onValueChange={(value) =>
                    updateTask(
                      task.id,
                      { assigneeId: value === 'unassigned' ? null : value },
                      'Gorev sorumlusu guncellendi',
                    )
                  }
                  disabled={isRowPending}
                >
                  <SelectTrigger size="sm" className="w-full" data-testid={`task-owner-${task.id}`}>
                    <SelectValue>{task.assigneeId ? users.find((user) => user.id === task.assigneeId)?.name ?? 'Atanmamis' : 'Atanmamis'}</SelectValue>
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
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
