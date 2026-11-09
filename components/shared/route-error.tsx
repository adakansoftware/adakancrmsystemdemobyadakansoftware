'use client'

import { useEffect } from 'react'
import { useI18n } from '@/components/i18n/locale-provider'
import { Button } from '@/components/ui/button'

export function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useI18n()

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border bg-card p-6 text-center">
      <h2 className="text-xl font-semibold">{t('error.title')}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{t('error.sectionDescription')}</p>
      <Button onClick={reset}>{t('error.retry')}</Button>
    </div>
  )
}
