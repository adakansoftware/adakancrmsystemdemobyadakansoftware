import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/lib/db/generated/prisma/client'
import { env } from '@/lib/env'

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.databaseUrl }),
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

function getClient(): DbClient {
  if (!global.__prisma__) {
    global.__prisma__ = createPrismaClient()
  }
  return global.__prisma__
}

// Lazy proxy: importing the module must not require DATABASE_URL, so test
// suites that transitively import this file without touching the database
// stay hermetic.
export const db: DbClient = new Proxy({} as DbClient, {
  get(_target, property) {
    const client = getClient()
    const value = Reflect.get(client, property) as unknown
    return typeof value === 'function' ? value.bind(client) : value
  },
})
