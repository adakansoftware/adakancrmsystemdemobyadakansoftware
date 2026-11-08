import { PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { TasksListClient } from '@/app/(app)/gorevler/tasks-list-client'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { getAssignableUsers, getTasksPageData } from '@/lib/crm/queries'
import { getI18n } from '@/lib/i18n/server'

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { t } = await getI18n()
  const { q } = await searchParams
  const normalizedQuery = q?.trim().toLowerCase() ?? ''
  const [tasks, users] = await Promise.all([getTasksPageData(), getAssignableUsers()])
  const filteredTasks = normalizedQuery
    ? tasks.filter((task) =>
        [task.title, task.related, task.assignee]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : tasks
  const openCount = filteredTasks.filter((task) => task.status !== 'DONE').length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('tasks.title')}
        description={
          normalizedQuery
            ? t('tasks.searchResults', { query: q ?? '' })
            : t('tasks.description', { count: openCount })
        }
        actions={
          <Button
            nativeButton={false}
            render={
              <Link href="/gorevler?quickCreate=task">
                <PlusIcon data-icon="inline-start" />
                {t('tasks.newTask')}
              </Link>
            }
          />
        }
      />

      <TasksListClient tasks={filteredTasks} users={users} />
    </div>
  )
}
