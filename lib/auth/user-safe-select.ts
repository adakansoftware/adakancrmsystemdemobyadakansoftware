import { Prisma } from '@prisma/client'

export const roleSummarySelect = Prisma.validator<Prisma.RoleSelect>()({
  id: true,
  name: true,
  slug: true,
})

export const managedUserRoleSelect = Prisma.validator<Prisma.UserRoleSelect>()({
  roleId: true,
  role: {
    select: roleSummarySelect,
  },
})

export const managedUserSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  status: true,
  roles: {
    select: managedUserRoleSelect,
  },
})

export const roleAssignmentSelect = Prisma.validator<Prisma.UserRoleSelect>()({
  userId: true,
  roleId: true,
  user: {
    select: managedUserSelect,
  },
  role: {
    select: roleSummarySelect,
  },
})

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
