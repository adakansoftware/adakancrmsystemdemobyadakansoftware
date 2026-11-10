import { Prisma } from '@/lib/db/generated/prisma/client'

export const roleSummarySelect = {
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.RoleSelect

export const managedUserRoleSelect = {
  roleId: true,
  role: {
    select: roleSummarySelect,
  },
} satisfies Prisma.UserRoleSelect

export const managedUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  status: true,
  roles: {
    select: managedUserRoleSelect,
  },
} satisfies Prisma.UserSelect

export const roleAssignmentSelect = {
  userId: true,
  roleId: true,
  user: {
    select: managedUserSelect,
  },
  role: {
    select: roleSummarySelect,
  },
} satisfies Prisma.UserRoleSelect

export type ManagedUserRecord = Prisma.UserGetPayload<{
  select: typeof managedUserSelect
}>

export type ManagedRoleAssignmentRecord = Prisma.UserRoleGetPayload<{
  select: typeof roleAssignmentSelect
}>

export function toManagedUserSummary(user: ManagedUserRecord) {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    firstName: user.firstName,
    lastName: user.lastName,
    roleSlugs: user.roles.map((entry) => entry.role.slug),
  }
}

export function toManagedRoleAssignmentSummary(
  assignment: ManagedRoleAssignmentRecord,
) {
  return {
    userId: assignment.userId,
    roleId: assignment.roleId,
    user: toManagedUserSummary(assignment.user),
    role: assignment.role,
  }
}
