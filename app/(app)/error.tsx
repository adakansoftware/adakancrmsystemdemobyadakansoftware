'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border bg-card p-6 text-center">
      <h2 className="text-xl font-semibold">Bir şeyler ters gitti</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Sayfa yüklenirken beklenmeyen bir hata oluştu. Tekrar deneyebilir veya
        farklı bir bölüme geçebilirsiniz.
      </p>
      <Button onClick={reset}>Tekrar Dene</Button>
    </div>
  )
}
