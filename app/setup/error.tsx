'use client'

import { Button } from '@/components/ui/button'

export default function SetupError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto mt-24 flex max-w-lg flex-col gap-4 rounded-xl border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">Kurulum ekranı yüklenemedi.</p>
      <Button onClick={reset}>Tekrar Dene</Button>
    </div>
  )
}
