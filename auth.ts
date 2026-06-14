import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { z } from 'zod'
import { createAuditLog } from '@/lib/audit/log'
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'
import { verifyPassword } from '@/lib/auth/password'
import { db } from '@/lib/db/prisma'

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

const authSecret =
  process.env.NEXTAUTH_SECRET ??
  process.env.AUTH_SECRET ??
  process.env.SESSION_SECRET ??
  (process.env.NODE_ENV === 'production'
    ? undefined
    : 'adikan-crm-dev-secret-change-in-production')

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  secret: authSecret,
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name: SESSION_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
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

        const user = await db.user.findUnique({
          where: {
            email: credentials.data.email.toLowerCase(),
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
      }

      if (user) {
        mutableToken.id = user.id
        mutableToken.firstName = (user as { firstName?: string }).firstName
        mutableToken.lastName = (user as { lastName?: string }).lastName
        mutableToken.roleSlugs = (user as { roleSlugs?: string[] }).roleSlugs ?? []
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
    }
  }

  interface User {
    firstName?: string
    lastName?: string
    roleSlugs?: string[]
  }
}
