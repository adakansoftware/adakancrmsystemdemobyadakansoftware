'use server'

import { redirect } from 'next/navigation'
import { db } from '@/lib/db/prisma'
import { createAuditLog } from '@/lib/audit/log'
import { ensureSystemRoles } from '@/lib/crm/bootstrap'
import { clearSession, createSession, getCurrentSession } from '@/lib/auth/session'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { createValidatedAction } from '@/lib/actions/create-validated-action'
import {
  loginSchema,
  setupSchema,
  userRoleAssignmentSchema,
} from '@/lib/validation/crm'
import { requirePermission } from '@/lib/auth/rbac'

export const loginAction = createValidatedAction(loginSchema, async (input) => {
  await ensureSystemRoles()

  const user = await db.user.findUnique({
    where: {
      email: input.email.toLowerCase(),
    },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  })

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new Error('Invalid credentials')
  }

  if (user.status !== 'ACTIVE' && user.status !== 'INVITED') {
    throw new Error('User account is not active')
  }

  await createSession(user.id)
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), status: 'ACTIVE' },
  })

  await createAuditLog({
    actorId: user.id,
    action: 'LOGIN',
    entityType: 'User',
    entityId: user.id,
    summary: `User ${user.email} signed in`,
  })

  return {
    userId: user.id,
  }
})

export async function loginFormAction(formData: FormData) {
  const result = await loginAction({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  })

  if (!result.success) {
    redirect('/login?error=invalid_credentials')
  }

  redirect('/')
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

  await createSession(user.id)

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

  redirect('/')
}

export async function logoutAction() {
  const session = await getCurrentSession()

  await clearSession()

  if (session?.userId) {
    await createAuditLog({
      actorId: session.userId,
      action: 'LOGOUT',
      entityType: 'Session',
      entityId: session.id,
      summary: `User ${session.user.email} signed out`,
    })
  }

  redirect('/login')
}

export async function listUsersWithRoles() {
  await requirePermission('users:manage')

  return db.user.findMany({
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

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
      include: {
        user: true,
        role: true,
      },
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

    return assignment
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
      include: {
        user: true,
        role: true,
      },
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

    return assignment
  },
)
