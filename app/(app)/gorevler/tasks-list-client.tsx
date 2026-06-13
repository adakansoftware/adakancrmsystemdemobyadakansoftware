'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateTaskAction } from '@/app/actions/crm'
import { InlineSelectField } from '@/components/crm/inline-select-field'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { taskStatuses, type TaskRow, type UserOption } from '@/lib/crm/view-models'
import { formatDate } from '@/lib/format'
import { priorityMeta, taskPriorityLabels, taskStatusLabels } from '@/lib/ui-meta'

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
              <InlineSelectField
                value={task.status}
                onValueChange={(value) =>
                  updateTask(task.id, { status: value }, 'Gorev durumu guncellendi')
                }
                disabled={isRowPending}
                className="w-40"
                testId={`task-status-${task.id}`}
                ariaLabel={`${task.title} durumunu degistir`}
                options={taskStatuses.map((status) => ({
                  value: status,
                  label: taskStatusLabels[status],
                }))}
              />
              <div className="flex min-w-44 items-center gap-2">
                <Avatar className="size-7">
                  <AvatarFallback className="text-[10px]">
                    {task.assigneeInitials}
                  </AvatarFallback>
                </Avatar>
                <InlineSelectField
                  value={task.assigneeId ?? 'unassigned'}
                  onValueChange={(value) =>
                    updateTask(
                      task.id,
                      { assigneeId: value === 'unassigned' ? null : value },
                      'Gorev sorumlusu guncellendi',
                    )
                  }
                  disabled={isRowPending}
                  className="w-full"
                  testId={`task-owner-${task.id}`}
                  ariaLabel={`${task.title} sorumlusunu degistir`}
                  options={[
                    { value: 'unassigned', label: 'Atanmamis' },
                    ...users.map((user) => ({ value: user.id, label: user.name })),
                  ]}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
