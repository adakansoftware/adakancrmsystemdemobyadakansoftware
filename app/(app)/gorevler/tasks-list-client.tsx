'use client'

import { updateTaskAction } from '@/app/actions/crm'
import { InlineSelectField } from '@/components/crm/inline-select-field'
import { useEnumLabels } from '@/components/i18n/locale-provider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useOptimisticRowAction } from '@/hooks/use-optimistic-row-action'
import { type AssignableUsersData, type TasksPageData } from '@/lib/crm/queries'
import { taskStatuses } from '@/lib/crm/view-models'
import { formatDate } from '@/lib/format'
import { priorityMeta } from '@/lib/ui-meta'

export function TasksListClient({
  tasks,
  users,
}: {
  tasks: TasksPageData
  users: AssignableUsersData
}) {
  const { runRowAction, isRowPending } = useOptimisticRowAction<string>()
  const labels = useEnumLabels()

  function updateTask(
    taskId: string,
    payload: { status?: TasksPageData[number]['status']; assigneeId?: string | null },
    successMessage: string,
  ) {
    runRowAction(
      taskId,
      () =>
        updateTaskAction({
          id: taskId,
          ...payload,
        }),
      {
        successMessage,
        errorMessage: 'Gorev guncellemesi basarisiz',
      },
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col p-0">
        {tasks.map((task, index) => {
          const rowPending = isRowPending(task.id)

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
                {labels.taskPriority[task.priority]}
              </Badge>
              <InlineSelectField
                value={task.status}
                onValueChange={(value) =>
                  updateTask(task.id, { status: value }, 'Gorev durumu guncellendi')
                }
                disabled={rowPending}
                className="w-40"
                testId={`task-status-${task.id}`}
                ariaLabel={`${task.title} durumunu degistir`}
                options={taskStatuses.map((status) => ({
                  value: status,
                  label: labels.taskStatus[status],
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
                  disabled={rowPending}
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
