import { redirect } from 'next/navigation'
import { setupFormAction } from '@/app/actions/auth'
import { db } from '@/lib/db/prisma'
import { getCurrentSession } from '@/lib/auth/session'
import { getI18n } from '@/lib/i18n/server'

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await getCurrentSession()
  const userCount = await db.user.count()
  const params = await searchParams

  if (session) {
    redirect('/')
  }

  if (userCount > 0) {
    redirect('/login')
  }

  const { t } = await getI18n()

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <form
        action={setupFormAction}
        className="flex w-full max-w-lg flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t('auth.setupTitle')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('auth.setupDescription')}
          </p>
        </div>
        {params.error ? (
          <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {t('auth.setupFailed')}
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span>{t('auth.firstName')}</span>
            <input
              name="firstName"
              required
              className="h-10 rounded-md border px-3"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>{t('auth.lastName')}</span>
            <input
              name="lastName"
              required
              className="h-10 rounded-md border px-3"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span>{t('auth.email')}</span>
          <input
            name="email"
            type="email"
            required
            className="h-10 rounded-md border px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{t('auth.password')}</span>
          <input
            name="password"
            type="password"
            required
            className="h-10 rounded-md border px-3"
          />
        </label>
        <button
          type="submit"
          className="h-10 rounded-md bg-primary px-4 text-primary-foreground"
        >
          {t('auth.createOwner')}
        </button>
      </form>
    </main>
  )
}
