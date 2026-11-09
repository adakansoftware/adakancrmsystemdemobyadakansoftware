'use client'

import { useI18n } from '@/components/i18n/locale-provider'
import { Button } from '@/components/ui/button'

export default function SetupError({ reset }: { reset: () => void }) {
  const { t } = useI18n()
  return (
    <div className="mx-auto mt-24 flex max-w-lg flex-col gap-4 rounded-xl border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">{t('auth.setupError')}</p>
      <Button onClick={reset}>{t('auth.retry')}</Button>
    </div>
  )
}
