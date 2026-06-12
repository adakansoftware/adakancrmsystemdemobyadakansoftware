'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatCompact } from '@/lib/format'

const config = {
  gelir: { label: 'Gelir', color: 'var(--chart-1)' },
  hedef: { label: 'Hedef', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function RevenueChart({
  data,
}: {
  data: Array<{ month: string; gelir: number; hedef: number }>
}) {
  return (
    <ChartContainer config={config} className="h-[260px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillGelir" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-gelir)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-gelir)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillHedef" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-hedef)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--color-hedef)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(value) => formatCompact(value as number)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {config[name as keyof typeof config]?.label}
                  </span>
                  <span className="font-mono font-medium">
                    {formatCompact(value as number)} ₺
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          dataKey="hedef"
          type="monotone"
          stroke="var(--color-hedef)"
          strokeDasharray="4 4"
          fill="url(#fillHedef)"
          strokeWidth={2}
        />
        <Area
          dataKey="gelir"
          type="monotone"
          stroke="var(--color-gelir)"
          fill="url(#fillGelir)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
