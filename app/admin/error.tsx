'use client'

import { Button } from '@/components/ui/button'

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">Yönetim alanı yüklenemedi.</p>
      <Button onClick={reset}>Tekrar Dene</Button>
    </div>
  )
}
