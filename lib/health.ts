export type HealthCheck = {
  key: string
  ok: boolean
  detail: string
}

export type HealthSummaryOptions = {
  appUrlConfigured: boolean
  sessionSecretConfigured: boolean
  databaseConfigured: boolean
  directUrlConfigured: boolean
  databaseOk: boolean
  userCount: number
}

export function buildHealthSummary(options: HealthSummaryOptions) {
  const checks: HealthCheck[] = [
    {
      key: 'database_url',
      ok: options.databaseConfigured,
      detail: options.databaseConfigured ? 'DATABASE_URL tanimli.' : 'DATABASE_URL eksik.',
    },
    {
      key: 'session_secret',
      ok: options.sessionSecretConfigured,
      detail: options.sessionSecretConfigured
        ? 'SESSION_SECRET / NEXTAUTH_SECRET tanimli.'
        : 'SESSION_SECRET / NEXTAUTH_SECRET eksik.',
    },
    {
      key: 'app_url',
      ok: options.appUrlConfigured,
      detail: options.appUrlConfigured
        ? 'APP_URL / NEXTAUTH_URL tanimli.'
        : 'APP_URL / NEXTAUTH_URL eksik.',
    },
    {
      key: 'database_connection',
      ok: options.databaseOk,
      detail: options.databaseOk ? 'Veritabani baglantisi saglikli.' : 'Veritabani baglantisi basarisiz.',
    },
    {
      key: 'seed_readiness',
      ok: options.userCount > 0,
      detail:
        options.userCount > 0
          ? `${options.userCount} kullanici bulundu.`
          : 'Henuz kullanici yok, setup veya seed bekleniyor.',
    },
  ]

  const ok = checks.every((check) => check.ok)
  const warn = checks.some((check) => !check.ok) && options.databaseConfigured && options.sessionSecretConfigured
  const status = ok ? 'ok' : warn ? 'warn' : 'error'
  const envWarnings = checks.filter((check) => !check.ok).map((check) => check.detail)

  return {
    ok,
    status,
    checks,
    envReady: options.databaseConfigured && options.sessionSecretConfigured,
    envWarnings,
    appUrlConfigured: options.appUrlConfigured,
    directUrlConfigured: options.directUrlConfigured,
    databaseConfigured: options.databaseConfigured,
    sessionSecretConfigured: options.sessionSecretConfigured,
    databaseOk: options.databaseOk,
    userCount: options.userCount,
    timestamp: new Date().toISOString(),
  }
}
