import { PrismaClient } from '@prisma/client'
import { env } from '@/lib/env'

function createPrismaClient() {
  return new PrismaClient({
    log: env.isDevelopment ? ['error', 'warn'] : ['error'],
    omit: {
      user: {
        passwordHash: true,
      },
    },
  })
}

type DbClient = ReturnType<typeof createPrismaClient>

declare global {
  var __prisma__: DbClient | undefined
}

export const db = global.__prisma__ ?? createPrismaClient()

if (!env.isProduction) {
  global.__prisma__ = db
}
