import crypto from 'node:crypto'
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
  TRUST_PROXY_HEADERS: z
    .enum(['true', 'false'])
    .optional(),
})

const devSessionSecret = crypto.randomBytes(32).toString('hex')

export function createEnv(source: NodeJS.ProcessEnv) {
  const parsedEnv = envSchema.safeParse({
    NODE_ENV: source.NODE_ENV,
    DATABASE_URL: source.DATABASE_URL,
    DIRECT_URL: source.DIRECT_URL,
    NEXTAUTH_SECRET: source.NEXTAUTH_SECRET,
    AUTH_SECRET: source.AUTH_SECRET,
    SESSION_SECRET: source.SESSION_SECRET,
    NEXTAUTH_URL: source.NEXTAUTH_URL,
    AUTH_URL: source.AUTH_URL,
    APP_URL: source.APP_URL,
    TRUST_PROXY_HEADERS: source.TRUST_PROXY_HEADERS,
  })

  if (!parsedEnv.success) {
    throw new Error(
      `Ortam degiskenleri gecersiz: ${parsedEnv.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`,
    )
  }

  const rawEnv = parsedEnv.data
  const isProduction = rawEnv.NODE_ENV === 'production'
  const isProductionBuild = source.NEXT_PHASE === 'phase-production-build'
  const sessionSecretConfigured = Boolean(
    rawEnv.NEXTAUTH_SECRET ?? rawEnv.AUTH_SECRET ?? rawEnv.SESSION_SECRET,
  )

  if (isProduction && !isProductionBuild && !sessionSecretConfigured) {
    throw new Error(
      'Production ortaminda NEXTAUTH_SECRET, AUTH_SECRET veya SESSION_SECRET tanimli olmali.',
    )
  }

  return {
    nodeEnv: rawEnv.NODE_ENV,
    isProduction,
    isDevelopment: rawEnv.NODE_ENV === 'development',
    databaseUrl: rawEnv.DATABASE_URL,
    databaseConfigured: Boolean(rawEnv.DATABASE_URL),
    directUrl: rawEnv.DIRECT_URL ?? null,
    directUrlConfigured: Boolean(rawEnv.DIRECT_URL),
    sessionSecret:
      rawEnv.NEXTAUTH_SECRET ??
      rawEnv.AUTH_SECRET ??
      rawEnv.SESSION_SECRET ??
      devSessionSecret,
    sessionSecretConfigured,
    appUrl: rawEnv.NEXTAUTH_URL ?? rawEnv.AUTH_URL ?? rawEnv.APP_URL ?? null,
    appUrlConfigured: Boolean(rawEnv.NEXTAUTH_URL ?? rawEnv.AUTH_URL ?? rawEnv.APP_URL),
    trustProxyHeaders:
      rawEnv.TRUST_PROXY_HEADERS === 'true' ||
      (rawEnv.TRUST_PROXY_HEADERS == null && source.VERCEL === '1'),
  }
}

export type AppEnv = ReturnType<typeof createEnv>

export function getEnv() {
  return createEnv(process.env)
}

export const env = new Proxy({} as AppEnv, {
  get(_target, property) {
    return getEnv()[property as keyof AppEnv]
  },
})
