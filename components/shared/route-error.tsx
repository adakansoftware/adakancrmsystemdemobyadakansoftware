'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export function RouteError({
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
      <h2 className="text-xl font-semibold">Bir seyler ters gitti</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Bu bolum yuklenirken beklenmeyen bir hata olustu. Tekrar deneyebilir veya farkli bir
        kayda gecebilirsiniz.
      </p>
      <Button onClick={reset}>Tekrar Dene</Button>
    </div>
  )
}
