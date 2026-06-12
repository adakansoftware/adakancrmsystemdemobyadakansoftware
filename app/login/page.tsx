import { redirect } from 'next/navigation'
import { loginFormAction } from '@/app/actions/auth'
import { getCurrentSession } from '@/lib/auth/session'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await getCurrentSession()
  const params = await searchParams

  if (session) {
    redirect('/')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <form
        action={loginFormAction}
        className="flex w-full max-w-md flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">CRM Login</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access the CRM workspace.
          </p>
        </div>
        {params.error ? (
          <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Invalid email or password.
          </p>
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          <span>Email</span>
          <input
            name="email"
            type="email"
            required
            className="h-10 rounded-md border px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Password</span>
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
          Sign in
        </button>
      </form>
    </main>
  )
}
