'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatCompact } from '@/lib/format'

const config = {
  value: { label: 'Deger', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function DashboardFunnelChart({
  data,
}: {
  data: Array<{ stage: string; count: number; value: number }>
}) {
  return (
    <ChartContainer config={config} className="h-[280px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 8, top: 8 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCompact(value as number)}
        />
        <YAxis
          type="category"
          dataKey="stage"
          tickLine={false}
          axisLine={false}
          width={92}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => (
                <div className="flex w-full items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {(item?.payload as { count?: number } | undefined)?.count ?? 0} deal
                  </span>
                  <span className="font-mono font-medium">
                    {formatCompact(value as number)} TL
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="value" fill="var(--color-value)" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
