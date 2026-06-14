import { Skeleton } from '@/components/ui/skeleton'

export function RouteLoading({
  cards = 3,
}: {
  cards?: number
}) {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className={`grid gap-4 ${cards > 1 ? 'md:grid-cols-3' : ''}`}>
        {Array.from({ length: cards }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  )
}
