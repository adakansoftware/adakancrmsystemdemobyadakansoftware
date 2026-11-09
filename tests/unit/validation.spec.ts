import { describe, expect, it } from 'vitest'
import {
  exportRouteQuerySchema,
  searchRouteQuerySchema,
} from '@/lib/validation/api'
import {
  changePasswordSchema,
  createUserAccountSchema,
  loginSchema,
  setupSchema,
} from '@/lib/validation/crm'
import {
  isStrongPassword,
  passwordPolicyDescription,
  strongPasswordSchema,
} from '@/lib/validation/password'

describe('route query schemas', () => {
  it('defaults the search query to an empty string', () => {
    expect(searchRouteQuerySchema.parse({}).q).toBe('')
  })

  it('accepts the dashboard export entity', () => {
    expect(exportRouteQuerySchema.safeParse({ entity: 'dashboard' }).success).toBe(true)
  })

  it('rejects unknown export entities', () => {
    expect(exportRouteQuerySchema.safeParse({ entity: 'users' }).success).toBe(false)
  })
})

describe('password policy', () => {
  it('accepts mixed-case passwords with a digit', () => {
    expect(isStrongPassword('Admin123')).toBe(true)
  })

  it('rejects weak passwords', () => {
    expect(isStrongPassword('password')).toBe(false)
  })

  it('returns the policy message for weak passwords', () => {
    const weakPassword = strongPasswordSchema().safeParse('password')
    expect(weakPassword.success).toBe(false)
    expect(weakPassword.error?.issues[0]?.message).toBe(passwordPolicyDescription)
  })
})

describe('account schemas', () => {
  it('accepts a strong setup password', () => {
    const setupResult = setupSchema.safeParse({
      firstName: 'Ada',
      lastName: 'Kan',
      email: 'ada@example.com',
      password: 'Password1',
    })

    expect(setupResult.success).toBe(true)
  })

  it('rejects a weak setup password', () => {
    const weakSetupResult = setupSchema.safeParse({
      firstName: 'Ada',
      lastName: 'Kan',
      email: 'ada@example.com',
      password: 'password',
    })

    expect(weakSetupResult.success).toBe(false)
  })

  it('accepts a strong user creation payload', () => {
    const createUserResult = createUserAccountSchema.safeParse({
      firstName: 'Ada',
      lastName: 'Kan',
      email: 'ada@example.com',
      password: 'Admin123',
      roleId: 'role-1',
      status: 'INVITED',
    })

    expect(createUserResult.success).toBe(true)
  })

  it('accepts matching change password payloads', () => {
    const changePasswordResult = changePasswordSchema.safeParse({
      currentPassword: 'Current123',
      nextPassword: 'NextPass1',
      confirmPassword: 'NextPass1',
    })

    expect(changePasswordResult.success).toBe(true)
  })

  it('rejects a weak next password', () => {
    const weakChangePasswordResult = changePasswordSchema.safeParse({
      currentPassword: 'Current123',
      nextPassword: 'nextpass',
      confirmPassword: 'nextpass',
    })

    expect(weakChangePasswordResult.success).toBe(false)
  })

  it('does not block legacy passwords on login', () => {
    const loginResult = loginSchema.safeParse({
      email: 'ada@example.com',
      password: 'legacy123',
    })

    expect(loginResult.success).toBe(true)
  })
})
