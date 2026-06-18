import type { Permission } from '@/lib/auth/rbac'

export const exportEntityPermissions = {
  contacts: ['contacts:read'],
  companies: ['companies:read'],
  leads: ['leads:read'],
  dashboard: ['contacts:read', 'companies:read', 'leads:read', 'deals:read'],
} satisfies Record<string, Permission[]>

export function getExportEntityPermissions(entity: keyof typeof exportEntityPermissions) {
  return exportEntityPermissions[entity]
}
