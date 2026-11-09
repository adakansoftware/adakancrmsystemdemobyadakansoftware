'use client'

import { useI18n } from '@/components/i18n/locale-provider'
import { translateMessage } from '@/lib/i18n'

export function ErrorText({ message }: { message?: string }) {
  const { t } = useI18n()

  if (!message) {
    return null
  }

  return <p className="text-xs text-destructive">{translateMessage(t, message)}</p>
}
