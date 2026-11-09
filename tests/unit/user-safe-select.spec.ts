import { describe, expect, it } from 'vitest'
import {
  toManagedRoleAssignmentSummary,
  toManagedUserSummary,
} from '@/lib/auth/user-safe-select'

const managedUser = {
  id: 'user-1',
  email: 'user@example.com',
  firstName: 'Ada',
  lastName: 'Kan',
  status: 'ACTIVE' as const,
  roles: [
    {
      roleId: 'role-1',
      role: {
        id: 'role-1',
        name: 'Owner',
        slug: 'owner',
      },
    },
  ],
}

describe('user safe select summaries', () => {
  it('keeps passwordHash out of the user summary', () => {
    const userSummary = toManagedUserSummary(managedUser)
    expect(JSON.stringify(userSummary)).not.toContain('passwordHash')
  })

  it('keeps passwordHash out of the role assignment summary', () => {
    const roleAssignmentSummary = toManagedRoleAssignmentSummary({
      userId: 'user-1',
      roleId: 'role-1',
      user: managedUser,
      role: {
        id: 'role-1',
        name: 'Owner',
        slug: 'owner',
      },
    })

    expect(JSON.stringify(roleAssignmentSummary)).not.toContain('passwordHash')
  })
})
