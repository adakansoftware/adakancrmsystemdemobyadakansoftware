import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { z } from 'zod'
import { createAuditLog } from '@/lib/audit/log'
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from '@/lib/auth/constants'
import {
  assertLoginRateLimit,
  clearLoginRateLimit,
} from '@/lib/auth/login-rate-limit'
import { verifyPassword } from '@/lib/auth/password'
import { db } from '@/lib/db/prisma'
import { env } from '@/lib/env'

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db as never),
  secret: env.sessionSecret,
  session: {
    strategy: 'jwt',
    maxAge: SESSION_TTL_SECONDS,
  },
  cookies: {
    sessionToken: {
      name: SESSION_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: env.isProduction,
        maxAge: SESSION_TTL_SECONDS,
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(rawCredentials) {
        const credentials = credentialsSchema.safeParse(rawCredentials)
        if (!credentials.success) {
          return null
        }

        const rateLimitContext = await assertLoginRateLimit(
          credentials.data.email,
          env.trustProxyHeaders,
        )

        const user = await db.user.findUnique({
          where: {
            email: credentials.data.email.toLowerCase(),
          },
          omit: {
            passwordHash: false,
          },
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        })

        if (!user) {
          return null
        }

        const isValid = await verifyPassword(
          credentials.data.password,
          user.passwordHash,
        )

        if (!isValid || (user.status !== 'ACTIVE' && user.status !== 'INVITED')) {
          return null
        }

        await clearLoginRateLimit(rateLimitContext.keys)

        await db.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            status: 'ACTIVE',
            name: user.name ?? `${user.firstName} ${user.lastName}`.trim(),
          },
        })

        await createAuditLog({
          actorId: user.id,
          action: 'LOGIN',
          entityType: 'User',
          entityId: user.id,
          summary: `User ${user.email} signed in`,
        })

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          firstName: user.firstName,
          lastName: user.lastName,
          roleSlugs: user.roles.map((entry) => entry.role.slug),
          sessionVersion: user.sessionVersion,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const mutableToken = token as typeof token & {
        id?: string
        firstName?: string
        lastName?: string
        roleSlugs?: string[]
        sessionVersion?: number
      }

      if (user) {
        mutableToken.id = user.id
        mutableToken.firstName = (user as { firstName?: string }).firstName
        mutableToken.lastName = (user as { lastName?: string }).lastName
        mutableToken.roleSlugs = (user as { roleSlugs?: string[] }).roleSlugs ?? []
        mutableToken.sessionVersion =
          (user as { sessionVersion?: number }).sessionVersion ?? 0
      }

      return mutableToken
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? '')
        session.user.firstName = String(token.firstName ?? '')
        session.user.lastName = String(token.lastName ?? '')
        session.user.roleSlugs = Array.isArray(token.roleSlugs)
          ? token.roleSlugs.map(String)
          : []
        session.user.sessionVersion =
          typeof token.sessionVersion === 'number' ? token.sessionVersion : 0
      }

      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      firstName: string
      lastName: string
      roleSlugs: string[]
      sessionVersion: number
    }
  }

  interface User {
    firstName?: string
    lastName?: string
    roleSlugs?: string[]
    sessionVersion?: number
  }
}
