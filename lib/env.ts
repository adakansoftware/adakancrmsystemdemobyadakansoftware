import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL tanimli olmali'),
  DIRECT_URL: z.string().min(1).optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  SESSION_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  AUTH_URL: z.string().url().optional(),
  APP_URL: z.string().url().optional(),
})

const parsedEnv = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  AUTH_SECRET: process.env.AUTH_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  AUTH_URL: process.env.AUTH_URL,
  APP_URL: process.env.APP_URL,
})

if (!parsedEnv.success) {
  throw new Error(
    `Ortam degiskenleri gecersiz: ${parsedEnv.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`,
  )
}

const rawEnv = parsedEnv.data
const isProduction = rawEnv.NODE_ENV === 'production'
const sessionSecretConfigured = Boolean(
  rawEnv.NEXTAUTH_SECRET ?? rawEnv.AUTH_SECRET ?? rawEnv.SESSION_SECRET,
)
const sessionSecret =
  rawEnv.NEXTAUTH_SECRET ??
  rawEnv.AUTH_SECRET ??
  rawEnv.SESSION_SECRET ??
  'adikan-crm-dev-secret-change-in-production'

export const env = {
  nodeEnv: rawEnv.NODE_ENV,
  isProduction,
  isDevelopment: rawEnv.NODE_ENV === 'development',
  databaseUrl: rawEnv.DATABASE_URL,
  databaseConfigured: Boolean(rawEnv.DATABASE_URL),
  directUrl: rawEnv.DIRECT_URL ?? null,
  directUrlConfigured: Boolean(rawEnv.DIRECT_URL),
  sessionSecret,
  sessionSecretConfigured,
  appUrl: rawEnv.NEXTAUTH_URL ?? rawEnv.AUTH_URL ?? rawEnv.APP_URL ?? null,
  appUrlConfigured: Boolean(rawEnv.NEXTAUTH_URL ?? rawEnv.AUTH_URL ?? rawEnv.APP_URL),
}
