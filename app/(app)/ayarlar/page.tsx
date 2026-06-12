import { redirect } from 'next/navigation'
import { listUsersWithRoles } from '@/app/actions/auth'
import { SettingsClient } from '@/app/(app)/ayarlar/settings-client'
import { PageHeader } from '@/components/shared/page-header'
import { getRoleSlugs, requireAuthenticatedUser } from '@/lib/auth/rbac'
import { SYSTEM_ROLE_DEFINITIONS } from '@/lib/auth/constants'
import { db } from '@/lib/db/prisma'

export default async function SettingsPage() {
  const session = await requireAuthenticatedUser()
  const roleSlugs = getRoleSlugs(session)
  const canManageUsers = roleSlugs.includes('owner')
  const users = canManageUsers ? await listUsersWithRoles() : []
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
      <PageHeader
        title="Ayarlar"
        description="Profil, güvenlik ve kullanıcı yönetimi ayarları"
      />
      <SettingsClient
        currentUser={{
          id: session.user.id,
          name: `${session.user.firstName} ${session.user.lastName}`,
          email: session.user.email,
          roles: roleSlugs,
        }}
        canManageUsers={canManageUsers}
        users={users.map((user) => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          status: user.status,
          roleIds: user.roles.map((entry) => entry.roleId),
          roleSlugs: user.roles.map((entry) => entry.role.slug),
        }))}
        roles={roles.map((role) => ({
          id: role.id,
          slug: role.slug,
          name: role.name,
        }))}
      />
    </div>
  )
}
