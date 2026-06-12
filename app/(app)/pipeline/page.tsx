import Link from 'next/link'
import { Plus } from 'lucide-react'
import {
  getDealPipelineBoardAction,
  listDealPipelines,
} from '@/app/actions/crm'
import { PipelineBoardClient } from '@/app/(app)/pipeline/pipeline-board-client'
import { PipelineSwitcher } from '@/app/(app)/pipeline/pipeline-switcher'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ pipelineId?: string }>
}) {
  const { pipelineId } = await searchParams
  const pipelines = await listDealPipelines()
  const boardResult = await getDealPipelineBoardAction({
    pipelineId: pipelineId ?? pipelines[0]?.id ?? null,
  })

  if (!boardResult.success || !boardResult.data) {
    return (
      <>
        <PageHeader
          title="Pipeline"
          description="Pipeline verisi bulunamadı."
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Çoklu pipeline, özel stage ve kalıcı anlaşma hareketleri"
        actions={
          <>
            <PipelineSwitcher
              pipelines={pipelines.map((pipeline) => ({
                id: pipeline.id,
                name: pipeline.name,
              }))}
              value={boardResult.data.pipeline.id}
            />
            <Button
              render={
                <Link href="/anlasmalar">
                  <Plus data-icon="inline-start" />
                  Yeni Anlaşma
                </Link>
              }
            />
          </>
        }
      />

      <PipelineBoardClient initialBoard={boardResult.data} />
    </>
  )
}
