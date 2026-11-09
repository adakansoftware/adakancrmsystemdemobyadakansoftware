'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  createStageAction,
  updatePipelineAction,
  updateStageAction,
} from '@/app/actions/crm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/components/i18n/locale-provider'
import { Input } from '@/components/ui/input'
import { useOptimisticRowAction } from '@/hooks/use-optimistic-row-action'
import { useServerActionToast } from '@/hooks/use-server-action-toast'
import type { SettingsOverviewData } from '@/lib/crm/queries'

export function PipelineTab({ overview }: { overview: SettingsOverviewData }) {
  const { isPending } = useServerActionToast()
  const { t } = useI18n()
  const pipelineActions = useOptimisticRowAction<string>()
  const [newStageNames, setNewStageNames] = useState<Record<string, string>>({})
  const [pipelineNames, setPipelineNames] = useState<Record<string, string>>(
    Object.fromEntries(overview.pipelines.map((pipeline) => [pipeline.id, pipeline.name])),
  )
  const [stageEdits, setStageEdits] = useState<
    Record<string, { name: string; probability: string }>
  >(
    Object.fromEntries(
      overview.pipelines.flatMap((pipeline) =>
        pipeline.stages.map((stage) => [
          stage.id,
          { name: stage.name, probability: String(stage.probability) },
        ]),
      ),
    ),
  )

  function updatePipelineName(pipelineId: string) {
    pipelineActions.runRowAction(
      pipelineId,
      () =>
        updatePipelineAction({
          id: pipelineId,
          name: pipelineNames[pipelineId],
        }),
      {
        successMessage: t('settings.pipelineNameUpdated'),
        errorMessage: t('settings.pipelineUpdateFailed'),
      },
    )
  }

  function updateStage(stageId: string) {
    const edit = stageEdits[stageId]
    if (!edit) {
      return
    }

    pipelineActions.runRowAction(
      stageId,
      () =>
        updateStageAction({
          id: stageId,
          name: edit.name,
          probability: Number(edit.probability),
        }),
      {
        successMessage: t('settings.stageUpdated'),
        errorMessage: t('settings.stageUpdateFailed'),
      },
    )
  }

  function moveStage(pipelineId: string, stageId: string, direction: 'up' | 'down') {
    const pipeline = overview.pipelines.find((entry) => entry.id === pipelineId)
    if (!pipeline) {
      return
    }

    const sortedStages = [...pipeline.stages].sort((left, right) => left.position - right.position)
    const index = sortedStages.findIndex((stage) => stage.id === stageId)
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    const currentStage = sortedStages[index]
    const targetStage = sortedStages[swapIndex]

    if (!currentStage || !targetStage) {
      return
    }

    pipelineActions.runRowAction(
      pipelineId,
      async () => {
        const tempPosition = 999
        const tempResult = await updateStageAction({ id: currentStage.id, position: tempPosition })
        if (!tempResult.success) throw new Error(t('settings.stageTempOrderFailed'))
        const targetResult = await updateStageAction({
          id: targetStage.id,
          position: currentStage.position,
        })
        if (!targetResult.success) throw new Error(t('settings.targetStageUpdateFailed'))
        const currentResult = await updateStageAction({
          id: currentStage.id,
          position: targetStage.position,
        })
        if (!currentResult.success) throw new Error(t('settings.stageOrderUpdateFailed'))
        return currentResult
      },
      {
        successMessage: t('settings.stageOrderUpdated'),
        errorMessage: t('settings.stageOrderUpdateFailed'),
      },
    )
  }

  function createStage(pipelineId: string) {
    const pipeline = overview.pipelines.find((entry) => entry.id === pipelineId)
    const stageName = newStageNames[pipelineId]?.trim()

    if (!pipeline || !stageName) {
      toast.error(t('settings.stageNameRequired'))
      return
    }

    pipelineActions.runRowAction(
      pipelineId,
      () =>
        createStageAction({
          pipelineId,
          name: stageName,
          key: `${pipeline.key}-${stageName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          position: pipeline.stages.length,
          probability: 0,
          isClosed: false,
          isWon: false,
        }),
      {
        successMessage: t('settings.stageCreated'),
        errorMessage: t('settings.stageCreateFailed'),
        onSuccess: () => {
          setNewStageNames((current) => ({ ...current, [pipelineId]: '' }))
        },
      },
    )
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.systemSummary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{t('common.countCompanies', { count: overview.counts.companies })}</p>
            <p>{t('common.countContacts', { count: overview.counts.contacts })}</p>
            <p>{t('common.countDeals', { count: overview.counts.deals })}</p>
            <p>{t('common.countTasks', { count: overview.counts.tasks })}</p>
            <p>{t('common.countTags', { count: overview.tags.length })}</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>{t('settings.pipelineManagement')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{t('settings.pipelineManagementHint')}</p>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/pipeline">{t('settings.goToPipeline')}</Link>}
            />
          </CardContent>
        </Card>
      </div>

      {overview.pipelines.map((pipeline) => (
        <Card key={pipeline.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>
                {pipeline.isDefault
                  ? `${pipeline.name} ${t('settings.defaultBadge')}`
                  : pipeline.name}
              </span>
              <Badge variant={pipeline.isDefault ? 'success' : 'secondary'}>
                {t('common.countStages', { count: pipeline.stages.length })}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row">
              <Input
                value={pipelineNames[pipeline.id] ?? pipeline.name}
                onChange={(event) =>
                  setPipelineNames((current) => ({
                    ...current,
                    [pipeline.id]: event.target.value,
                  }))
                }
              />
              <Button
                onClick={() => updatePipelineName(pipeline.id)}
                disabled={pipelineActions.isRowPending(pipeline.id)}
              >
                {t('settings.savePipelineName')}
              </Button>
            </div>

            <div className="space-y-3">
              {pipeline.stages
                .slice()
                .sort((left, right) => left.position - right.position)
                .map((stage) => (
                  <div
                    key={stage.id}
                    className="grid gap-3 rounded-lg border p-3 lg:grid-cols-[minmax(0,1.5fr)_120px_auto]"
                  >
                    <Input
                      value={stageEdits[stage.id]?.name ?? stage.name}
                      onChange={(event) =>
                        setStageEdits((current) => ({
                          ...current,
                          [stage.id]: {
                            name: event.target.value,
                            probability:
                              current[stage.id]?.probability ?? String(stage.probability),
                          },
                        }))
                      }
                    />
                    <Input
                      value={stageEdits[stage.id]?.probability ?? String(stage.probability)}
                      onChange={(event) =>
                        setStageEdits((current) => ({
                          ...current,
                          [stage.id]: {
                            name: current[stage.id]?.name ?? stage.name,
                            probability: event.target.value,
                          },
                        }))
                      }
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={stage.isWon ? 'success' : stage.isClosed ? 'warning' : 'outline'}>
                        %{stage.probability}
                      </Badge>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => moveStage(pipeline.id, stage.id, 'up')}
                        disabled={isPending}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => moveStage(pipeline.id, stage.id, 'down')}
                        disabled={isPending}
                      >
                        <ArrowDown />
                      </Button>
                      <Button onClick={() => updateStage(stage.id)} disabled={isPending}>
                        {t('settings.saveStage')}
                      </Button>
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <Input
                placeholder={t('settings.newStagePlaceholder')}
                value={newStageNames[pipeline.id] ?? ''}
                onChange={(event) =>
                  setNewStageNames((current) => ({
                    ...current,
                    [pipeline.id]: event.target.value,
                  }))
                }
              />
              <Button onClick={() => createStage(pipeline.id)} disabled={isPending}>
                <Plus data-icon="inline-start" />
                {t('settings.addStage')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
