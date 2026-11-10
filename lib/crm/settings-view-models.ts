import type { Role } from '@/lib/db/generated/prisma/client'
import type { UsersWithRolesData } from '@/app/actions/auth'
import type { SessionUser } from '@/lib/auth/rbac'
import type { SettingsOverviewData } from '@/lib/crm/queries'

export const userStatuses = ['ACTIVE', 'INVITED', 'SUSPENDED', 'ARCHIVED'] as const

export type SettingsCurrentUser = {
  id: string
  name: string
  email: string
  roles: string[]
}

export type SettingsUserRow = {
  id: string
  name: string
  email: string
  status: UsersWithRolesData[number]['status']
  roleIds: string[]
  roleSlugs: string[]
}

export type SettingsRoleOption = Pick<Role, 'id' | 'slug' | 'name'>

export type SettingsClientProps = {
  currentUser: SettingsCurrentUser
  canManageUsers: boolean
  users: SettingsUserRow[]
  roles: SettingsRoleOption[]
  overview: SettingsOverviewData
}

export function toSettingsCurrentUser(sessionUser: SessionUser, roleSlugs: string[]) {
  return {
    id: sessionUser.id,
    name: `${sessionUser.firstName} ${sessionUser.lastName}`,
    email: sessionUser.email,
    roles: roleSlugs,
  } satisfies SettingsCurrentUser
}

export function toSettingsUserRows(users: UsersWithRolesData) {
  return users.map(
    (user) =>
      ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        status: user.status,
        roleIds: user.roles.map((entry) => entry.roleId),
        roleSlugs: user.roles.map((entry) => entry.role.slug),
      }) satisfies SettingsUserRow,
  )
}

export function toSettingsRoleOptions(roles: Role[]) {
  return roles.map(
    (role) =>
      ({
        id: role.id,
        slug: role.slug,
        name: role.name,
      }) satisfies SettingsRoleOption,
  )
}
