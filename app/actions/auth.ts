'use server'

import { AuthError } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { signIn, signOut } from '@/auth'
import { db } from '@/lib/db/prisma'
import { createAuditLog } from '@/lib/audit/log'
import { ensureSystemRoles } from '@/lib/crm/bootstrap'
import { getCurrentSession } from '@/lib/auth/session'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { createValidatedAction } from '@/lib/actions/create-validated-action'
import {
  managedUserSelect,
  roleAssignmentSelect,
  toManagedRoleAssignmentSummary,
  toManagedUserSummary,
} from '@/lib/auth/user-safe-select'
import {
  changePasswordSchema,
  createUserAccountSchema,
  loginSchema,
  setupSchema,
  updateProfileSchema,
  updateUserStatusSchema,
  userRoleAssignmentSchema,
} from '@/lib/validation/crm'
import { getRoleSlugs, requireAuthenticatedUser, requirePermission } from '@/lib/auth/rbac'

function revalidateAuthPaths() {
  for (const path of ['/', '/ayarlar', '/admin']) {
    revalidatePath(path)
  }
}

export async function loginFormAction(formData: FormData) {
  const parsedLogin = loginSchema.safeParse({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  })

  if (!parsedLogin.success) {
    redirect('/login?error=invalid_credentials')
  }

  try {
    await ensureSystemRoles()
    await signIn('credentials', {
      email: parsedLogin.data.email,
      password: parsedLogin.data.password,
      redirectTo: '/',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/login?error=invalid_credentials')
    }

    throw error
  }
}

export const setupAction = createValidatedAction(setupSchema, async (input) => {
  await ensureSystemRoles()

  const userCount = await db.user.count()

  if (userCount > 0) {
    throw new Error('System already initialized')
  }

  const ownerRole = await db.role.findUnique({
    where: {
      slug: 'owner',
    },
  })

  if (!ownerRole) {
    throw new Error('Owner role missing')
  }

  const user = await db.user.create({
    data: {
      email: input.email.toLowerCase(),
      name: `${input.firstName} ${input.lastName}`.trim(),
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash: await hashPassword(input.password),
      status: 'ACTIVE',
      roles: {
        create: {
          roleId: ownerRole.id,
        },
      },
    },
  })

  await createAuditLog({
    actorId: user.id,
    action: 'CREATE',
    entityType: 'User',
    entityId: user.id,
    summary: `Bootstrap owner account created for ${user.email}`,
  })

  return {
    userId: user.id,
  }
})

export async function setupFormAction(formData: FormData) {
  const result = await setupAction({
    firstName: String(formData.get('firstName') ?? ''),
    lastName: String(formData.get('lastName') ?? ''),
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  })

  if (!result.success) {
    redirect('/setup?error=setup_failed')
  }

  try {
    await signIn('credentials', {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      redirectTo: '/',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/setup?error=setup_failed')
    }

    throw error
  }
}

export async function logoutAction() {
  const session = await getCurrentSession()

  if (session?.userId) {
    await createAuditLog({
      actorId: session.userId,
      action: 'LOGOUT',
      entityType: 'Session',
      entityId: session.id,
      summary: `User ${session.user.email} signed out`,
    })
  }

  await signOut({
    redirectTo: '/login',
  })
}

export async function listUsersWithRoles() {
  await requirePermission('users:manage')

  return db.user.findMany({
    select: managedUserSelect,
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export type UsersWithRolesData = Awaited<ReturnType<typeof listUsersWithRoles>>

export const updateProfileAction = createValidatedAction(
  updateProfileSchema,
  async (input) => {
    const session = await requireAuthenticatedUser()

    const existingUser = await db.user.findFirst({
      where: {
        email: input.email.toLowerCase(),
        id: {
          not: session.userId,
        },
      },
      select: { id: true },
    })

    if (existingUser) {
      throw new Error('Bu e-posta adresi zaten kullanılıyor')
    }

    const user = await db.user.update({
      where: { id: session.userId },
      data: {
        name: `${input.firstName} ${input.lastName}`.trim(),
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email.toLowerCase(),
      },
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: user.id,
      summary: `Profile updated for ${user.email}`,
    })

    revalidateAuthPaths()
    return { id: user.id }
  },
)

export const changePasswordAction = createValidatedAction(
  changePasswordSchema,
  async (input) => {
    const session = await requireAuthenticatedUser()

    const user = await db.user.findUniqueOrThrow({
      where: { id: session.userId },
      omit: {
        passwordHash: false,
      },
    })

    const passwordMatches = await verifyPassword(
      input.currentPassword,
      user.passwordHash,
    )

    if (!passwordMatches) {
      throw new Error('Mevcut şifre doğrulanamadı')
    }

    const nextPasswordMatchesCurrent = await verifyPassword(
      input.nextPassword,
      user.passwordHash,
    )

    if (nextPasswordMatchesCurrent) {
      throw new Error('Yeni şifre mevcut şifreyle aynı olamaz')
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(input.nextPassword),
      },
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: user.id,
      summary: `Password updated for ${user.email}`,
    })

    return { id: user.id }
  },
)

export const createUserAccountAction = createValidatedAction(
  createUserAccountSchema,
  async (input) => {
    const session = await requirePermission('users:manage')
    const actorRoleSlugs = getRoleSlugs(session)

    if (!actorRoleSlugs.includes('owner')) {
      throw new Error('Sadece owner kullanıcılar yeni kullanıcı ekleyebilir')
    }

    const existingUser = await db.user.findUnique({
      where: {
        email: input.email.toLowerCase(),
      },
      select: { id: true },
    })

    if (existingUser) {
      throw new Error('Bu e-posta adresiyle kayıtlı kullanıcı zaten var')
    }

    const user = await db.user.create({
      data: {
        name: `${input.firstName} ${input.lastName}`.trim(),
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email.toLowerCase(),
        passwordHash: await hashPassword(input.password),
        status: input.status ?? 'INVITED',
        roles: {
          create: {
            roleId: input.roleId,
          },
        },
      },
      select: managedUserSelect,
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      summary: `User created: ${user.email}`,
    })

    revalidateAuthPaths()
    return toManagedUserSummary(user)
  },
)

export const updateUserStatusAction = createValidatedAction(
  updateUserStatusSchema,
  async (input) => {
    const session = await requirePermission('users:manage')
    const actorRoleSlugs = getRoleSlugs(session)

    if (!actorRoleSlugs.includes('owner')) {
      throw new Error('Sadece owner kullanıcılar durum güncelleyebilir')
    }

    if (input.userId === session.userId && input.status !== 'ACTIVE') {
      throw new Error('Kendi hesabınızı pasifleştiremezsiniz')
    }

    const user = await db.user.update({
      where: { id: input.userId },
      data: {
        status: input.status,
      },
      select: managedUserSelect,
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: user.id,
      summary: `User status updated to ${input.status} for ${user.email}`,
    })

    revalidateAuthPaths()
    return toManagedUserSummary(user)
  },
)

export const assignRoleAction = createValidatedAction(
  userRoleAssignmentSchema,
  async (input) => {
    const session = await requirePermission('roles:manage')

    const assignment = await db.userRole.upsert({
      where: {
        userId_roleId: {
          userId: input.userId,
          roleId: input.roleId,
        },
      },
      update: {},
      create: input,
      select: roleAssignmentSelect,
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'ASSIGN_ROLE',
      entityType: 'UserRole',
      entityId: assignment.userId,
      summary: `Assigned role ${assignment.role.slug} to ${assignment.user.email}`,
      metadata: {
        userId: assignment.userId,
        roleId: assignment.roleId,
      },
    })

    return toManagedRoleAssignmentSummary(assignment)
  },
)

export const removeRoleAction = createValidatedAction(
  userRoleAssignmentSchema,
  async (input) => {
    const session = await requirePermission('roles:manage')

    const assignment = await db.userRole.delete({
      where: {
        userId_roleId: {
          userId: input.userId,
          roleId: input.roleId,
        },
      },
      select: roleAssignmentSelect,
    })

    await createAuditLog({
      actorId: session.userId,
      action: 'REMOVE_ROLE',
      entityType: 'UserRole',
      entityId: assignment.userId,
      summary: `Removed role ${assignment.role.slug} from ${assignment.user.email}`,
      metadata: {
        userId: assignment.userId,
        roleId: assignment.roleId,
      },
    })

    return toManagedRoleAssignmentSummary(assignment)
  },
)
