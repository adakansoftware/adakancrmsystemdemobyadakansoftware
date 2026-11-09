import { redirect } from 'next/navigation'
import { listUsersWithRoles } from '@/app/actions/auth'
import { SettingsClient } from '@/app/(app)/ayarlar/settings-client'
import { PageHeader } from '@/components/shared/page-header'
import { getRoleSlugs, requireAuthenticatedUser } from '@/lib/auth/rbac'
import { SYSTEM_ROLE_DEFINITIONS } from '@/lib/auth/constants'
import { getSettingsOverviewData } from '@/lib/crm/queries'
import { getI18n } from '@/lib/i18n/server'
import {
  toSettingsCurrentUser,
  toSettingsRoleOptions,
  toSettingsUserRows,
} from '@/lib/crm/settings-view-models'
import { db } from '@/lib/db/prisma'

export default async function SettingsPage() {
  const session = await requireAuthenticatedUser()
  const { t } = await getI18n()
  const roleSlugs = getRoleSlugs(session)
  const canManageUsers = roleSlugs.includes('owner')
  const [users, settingsOverview] = await Promise.all([
    canManageUsers ? listUsersWithRoles() : Promise.resolve([]),
    getSettingsOverviewData(),
  ])
  const roles = canManageUsers
    ? await db.role.findMany({
        where: {
          slug: {
            in: SYSTEM_ROLE_DEFINITIONS.map((role) => role.slug),
          },
        },
        orderBy: { createdAt: 'asc' },
      })
    : []

  if (!session.user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('settings.title')} description={t('settings.pageDescription')} />
      <SettingsClient
        currentUser={toSettingsCurrentUser(session.user, roleSlugs)}
        canManageUsers={canManageUsers}
        users={toSettingsUserRows(users)}
        roles={toSettingsRoleOptions(roles)}
        overview={settingsOverview}
      />
    </div>
  )
}
