import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getDealPipelineBoardAction, listDealPipelines } from '@/app/actions/crm'
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
    return <PageHeader title="Pipeline" description="Pipeline verisi bulunamadi." />
  }

  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Coklu pipeline, ozel stage ve kalici anlasma hareketleri"
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
              nativeButton={false}
              render={
                <Link href="/pipeline?quickCreate=deal">
                  <Plus data-icon="inline-start" />
                  Yeni Anlasma
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
