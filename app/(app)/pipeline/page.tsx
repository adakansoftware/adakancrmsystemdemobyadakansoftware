import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getDealPipelineBoardAction, listDealPipelines } from '@/app/actions/crm'
import { PipelineBoardClient } from '@/app/(app)/pipeline/pipeline-board-client'
import { PipelineSwitcher } from '@/app/(app)/pipeline/pipeline-switcher'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { getI18n } from '@/lib/i18n/server'

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ pipelineId?: string }>
}) {
  const { t } = await getI18n()
  const { pipelineId } = await searchParams
  const pipelines = await listDealPipelines()
  const boardResult = await getDealPipelineBoardAction({
    pipelineId: pipelineId ?? pipelines[0]?.id ?? null,
  })

  if (!boardResult.success || !boardResult.data) {
    return <PageHeader title={t('pipeline.title')} description={t('pipeline.notFound')} />
  }

  return (
    <>
      <PageHeader
        title={t('pipeline.title')}
        description={t('pipeline.description')}
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
                  {t('pipeline.newDeal')}
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
