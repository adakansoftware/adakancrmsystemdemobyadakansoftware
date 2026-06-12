import { redirect } from 'next/navigation'
import type { SystemRoleSlug } from '@/lib/auth/constants'
import { getCurrentSession } from '@/lib/auth/session'

export type Permission =
  | 'companies:read'
  | 'companies:create'
  | 'companies:update'
  | 'companies:delete'
  | 'contacts:read'
  | 'contacts:create'
  | 'contacts:update'
  | 'contacts:delete'
  | 'leads:read'
  | 'leads:create'
  | 'leads:update'
  | 'leads:delete'
  | 'deals:read'
  | 'deals:create'
  | 'deals:update'
  | 'deals:delete'
  | 'activities:read'
  | 'notes:read'
  | 'notes:create'
  | 'notes:update'
  | 'notes:delete'
  | 'roles:manage'
  | 'users:manage'

const ALL_PERMISSIONS: Permission[] = [
  'companies:read',
  'companies:create',
  'companies:update',
  'companies:delete',
  'contacts:read',
  'contacts:create',
  'contacts:update',
  'contacts:delete',
  'leads:read',
  'leads:create',
  'leads:update',
  'leads:delete',
  'deals:read',
  'deals:create',
  'deals:update',
  'deals:delete',
  'activities:read',
  'notes:read',
  'notes:create',
  'notes:update',
  'notes:delete',
  'roles:manage',
  'users:manage',
]

const ROLE_PERMISSIONS: Record<SystemRoleSlug, Permission[]> = {
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  manager: [
    'companies:read',
    'companies:create',
    'companies:update',
    'contacts:read',
    'contacts:create',
    'contacts:update',
    'leads:read',
    'leads:create',
    'leads:update',
    'deals:read',
    'deals:create',
    'deals:update',
    'activities:read',
    'notes:read',
    'notes:create',
    'notes:update',
  ],
  sales: [
    'companies:read',
    'contacts:read',
    'contacts:create',
    'contacts:update',
    'leads:read',
    'leads:create',
    'leads:update',
    'deals:read',
    'deals:create',
    'deals:update',
    'activities:read',
    'notes:read',
    'notes:create',
    'notes:update',
  ],
  readonly: [
    'companies:read',
    'contacts:read',
    'leads:read',
    'deals:read',
    'activities:read',
    'notes:read',
  ],
}

export function getRoleSlugs(
  session: Awaited<ReturnType<typeof getCurrentSession>>,
) {
  return (
    session?.user.roles.map((userRole) => userRole.role.slug as SystemRoleSlug) ?? []
  )
}

export function hasPermission(roleSlugs: SystemRoleSlug[], permission: Permission) {
  return roleSlugs.some((slug) => ROLE_PERMISSIONS[slug]?.includes(permission))
}

export async function requirePermission(permission: Permission) {
  const session = await getCurrentSession()

  if (!session) {
    redirect('/login')
  }

  const roleSlugs = getRoleSlugs(session)

  if (!hasPermission(roleSlugs, permission)) {
    throw new Error(`Forbidden: missing permission ${permission}`)
  }

  return session
}

export async function requireAuthenticatedUser() {
  const session = await getCurrentSession()

  if (!session) {
    redirect('/login')
  }

  return session
}
