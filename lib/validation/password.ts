import { z } from 'zod'

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128
export const passwordPolicyDescription = 'validation.passwordPolicy'

function hasUppercase(value: string) {
  return /[A-Z]/.test(value)
}

function hasLowercase(value: string) {
  return /[a-z]/.test(value)
}

function hasDigit(value: string) {
  return /\d/.test(value)
}

export function isStrongPassword(value: string) {
  return hasUppercase(value) && hasLowercase(value) && hasDigit(value)
}

export function strongPasswordSchema(message = passwordPolicyDescription) {
  return z
    .string()
    .min(PASSWORD_MIN_LENGTH, message)
    .max(PASSWORD_MAX_LENGTH, 'validation.passwordMax')
    .refine(isStrongPassword, {
      message,
    })
}
