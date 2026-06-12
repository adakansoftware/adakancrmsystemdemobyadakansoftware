'use client'

import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function PipelineSwitcher({
  pipelines,
  value,
}: {
  pipelines: Array<{ id: string; name: string }>
  value: string
}) {
  const router = useRouter()

  return (
    <Select
      defaultValue={value}
      onValueChange={(nextValue) => {
        router.push(`/pipeline?pipelineId=${nextValue}`)
      }}
    >
      <SelectTrigger className="min-w-[220px]">
        <SelectValue placeholder="Pipeline seçin" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {pipelines.map((pipeline) => (
            <SelectItem key={pipeline.id} value={pipeline.id}>
              {pipeline.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
