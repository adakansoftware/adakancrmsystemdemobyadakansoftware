export const SESSION_COOKIE_NAME = 'adakancms_session'
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7

export const SYSTEM_ROLE_DEFINITIONS = [
  {
    name: 'Owner',
    slug: 'owner',
    description: 'Full system access',
    isSystem: true,
  },
  {
    name: 'Admin',
    slug: 'admin',
    description: 'Administrative access across CRM modules',
    isSystem: true,
  },
  {
    name: 'Manager',
    slug: 'manager',
    description: 'Operational access to manage sales data',
    isSystem: true,
  },
  {
    name: 'Sales',
    slug: 'sales',
    description: 'Sales-focused access to owned and assigned records',
    isSystem: true,
  },
  {
    name: 'Readonly',
    slug: 'readonly',
    description: 'Read-only CRM access',
    isSystem: true,
  },
] as const

export type SystemRoleSlug = (typeof SYSTEM_ROLE_DEFINITIONS)[number]['slug']
