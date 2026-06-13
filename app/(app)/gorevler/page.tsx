import { PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { TasksListClient } from '@/app/(app)/gorevler/tasks-list-client'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { getAssignableUsers, getTasksPageData } from '@/lib/crm/queries'

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
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
        title="Gorevler"
        description={
          normalizedQuery
            ? `"${q}" icin gorev sonuclari`
            : `${openCount} acik gorev - ekibinizin yapilacak listesi`
        }
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

      <TasksListClient tasks={filteredTasks} users={users} />
    </div>
  )
}
