'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatCompact } from '@/lib/format'

const palette = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const

export function SalesPerformanceChart({
  data,
  seriesLabels,
}: {
  data: Array<Record<string, string | number>>
  seriesLabels: Record<string, string>
}) {
  const seriesKeys = Object.keys(data[0] ?? {}).filter((key) => key !== 'month')
  const config = Object.fromEntries(
    seriesKeys.map((key, index) => [
      key,
      {
        label: seriesLabels[key] ?? key,
        color: palette[index % palette.length],
      },
    ]),
  ) satisfies ChartConfig

  return (
    <ChartContainer config={config} className="h-[280px] w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {seriesKeys.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            fill={`var(--color-${key})`}
            radius={[6, 6, 0, 0]}
            maxBarSize={28}
          />
        ))}
      </BarChart>
    </ChartContainer>
  )
}

export function ActivityComparisonChart({
  data,
}: {
  data: Array<{ name: string; thisWeek: number; lastWeek: number }>
}) {
  const config = {
    thisWeek: { label: 'Bu Hafta', color: 'var(--chart-1)' },
    lastWeek: { label: 'Gecen Hafta', color: 'var(--chart-2)' },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="h-[280px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 8 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCompact(value as number)}
        />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={96}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="thisWeek" fill="var(--color-thisWeek)" radius={[0, 6, 6, 0]} />
        <Bar dataKey="lastWeek" fill="var(--color-lastWeek)" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
