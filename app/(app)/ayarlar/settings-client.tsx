'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  assignRoleAction,
  changePasswordAction,
  createUserAccountAction,
  removeRoleAction,
  updateProfileAction,
  updateUserStatusAction,
} from '@/app/actions/auth'
import { createStageAction, updatePipelineAction, updateStageAction } from '@/app/actions/crm'
import { InlineSelectField } from '@/components/crm/inline-select-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type SettingsClientProps = {
  currentUser: {
    id: string
    name: string
    email: string
    roles: string[]
  }
  canManageUsers: boolean
  users: Array<{
    id: string
    name: string
    email: string
    status: string
    roleIds: string[]
    roleSlugs: string[]
  }>
  roles: Array<{
    id: string
    slug: string
    name: string
  }>
  overview: {
    counts: {
      companies: number
      contacts: number
      deals: number
      tasks: number
    }
    pipelines: Array<{
      id: string
      name: string
      key: string
      description: string | null
      isDefault: boolean
      stages: Array<{
        id: string
        name: string
        position: number
        probability: number
        isClosed: boolean
        isWon: boolean
      }>
    }>
  }
}

const userStatuses = ['ACTIVE', 'INVITED', 'SUSPENDED', 'ARCHIVED'] as const

export function SettingsClient({
  currentUser,
  canManageUsers,
  users,
  roles,
  overview,
}: SettingsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [pendingPipelineId, setPendingPipelineId] = useState<string | null>(null)
  const [newStageNames, setNewStageNames] = useState<Record<string, string>>({})
  const [profileForm, setProfileForm] = useState(() => {
    const [firstName = '', lastName = ''] = currentUser.name.split(' ')
    return {
      firstName,
      lastName,
      email: currentUser.email,
    }
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    nextPassword: '',
    confirmPassword: '',
  })
  const [createUserForm, setCreateUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roleId: roles[0]?.id ?? '',
    status: 'INVITED',
  })
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

  function refreshWithSuccess(message: string) {
    toast.success(message)
    router.refresh()
  }

  function updatePipelineName(pipelineId: string) {
    startTransition(async () => {
      try {
        setPendingPipelineId(pipelineId)
        const result = await updatePipelineAction({
          id: pipelineId,
          name: pipelineNames[pipelineId],
        })
        if (!result.success) {
          throw new Error('Pipeline guncellenemedi')
        }
        refreshWithSuccess('Pipeline adi guncellendi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Pipeline guncellenemedi')
      } finally {
        setPendingPipelineId(null)
      }
    })
  }

  function updateStage(stageId: string) {
    const edit = stageEdits[stageId]
    if (!edit) {
      return
    }

    startTransition(async () => {
      try {
        setPendingPipelineId(stageId)
        const result = await updateStageAction({
          id: stageId,
          name: edit.name,
          probability: Number(edit.probability),
        })
        if (!result.success) {
          throw new Error('Stage guncellenemedi')
        }
        refreshWithSuccess('Stage guncellendi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Stage guncellenemedi')
      } finally {
        setPendingPipelineId(null)
      }
    })
  }

  function moveStage(
    pipelineId: string,
    stageId: string,
    direction: 'up' | 'down',
  ) {
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

    startTransition(async () => {
      try {
        setPendingPipelineId(pipelineId)
        const tempPosition = 999
        const tempResult = await updateStageAction({ id: currentStage.id, position: tempPosition })
        if (!tempResult.success) throw new Error('Stage sirasi gecici olarak guncellenemedi')
        const targetResult = await updateStageAction({
          id: targetStage.id,
          position: currentStage.position,
        })
        if (!targetResult.success) throw new Error('Hedef stage guncellenemedi')
        const currentResult = await updateStageAction({
          id: currentStage.id,
          position: targetStage.position,
        })
        if (!currentResult.success) throw new Error('Stage sirasi guncellenemedi')
        refreshWithSuccess('Stage sirasi guncellendi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Stage sirasi guncellenemedi')
      } finally {
        setPendingPipelineId(null)
      }
    })
  }

  function createStage(pipelineId: string) {
    const pipeline = overview.pipelines.find((entry) => entry.id === pipelineId)
    const stageName = newStageNames[pipelineId]?.trim()

    if (!pipeline || !stageName) {
      toast.error('Yeni stage icin ad girin')
      return
    }

    startTransition(async () => {
      try {
        setPendingPipelineId(pipelineId)
        const result = await createStageAction({
          pipelineId,
          name: stageName,
          key: `${pipeline.key}-${stageName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          position: pipeline.stages.length,
          probability: 0,
          isClosed: false,
          isWon: false,
        })
        if (!result.success) {
          throw new Error('Yeni stage olusturulamadi')
        }
        setNewStageNames((current) => ({ ...current, [pipelineId]: '' }))
        refreshWithSuccess('Yeni stage olusturuldu')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Stage olusturulamadi')
      } finally {
        setPendingPipelineId(null)
      }
    })
  }

  function updateUserRole(userId: string, nextSlug: string) {
    const user = users.find((entry) => entry.id === userId)
    const nextRole = roles.find((role) => role.slug === nextSlug)

    if (!user || !nextRole) {
      return
    }

    startTransition(async () => {
      try {
        setPendingUserId(userId)
        for (const roleId of user.roleIds) {
          const removeResult = await removeRoleAction({ userId, roleId })
          if (!removeResult.success) {
            throw new Error('Mevcut roller temizlenemedi')
          }
        }

        const assignResult = await assignRoleAction({
          userId,
          roleId: nextRole.id,
        })

        if (!assignResult.success) {
          throw new Error('Yeni rol atanamadi')
        }

        refreshWithSuccess('Kullanici rolu guncellendi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Rol guncellemesi basarisiz oldu')
      } finally {
        setPendingUserId(null)
      }
    })
  }

  function updateUserStatus(userId: string, status: (typeof userStatuses)[number]) {
    startTransition(async () => {
      try {
        setPendingUserId(userId)
        const result = await updateUserStatusAction({ userId, status })
        if (!result.success) {
          throw new Error('Kullanici durumu dogrulanamadi')
        }
        refreshWithSuccess('Kullanici durumu guncellendi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Durum guncellemesi basarisiz oldu')
      } finally {
        setPendingUserId(null)
      }
    })
  }

  function handleProfileSubmit() {
    startTransition(async () => {
      try {
        const result = await updateProfileAction(profileForm)
        if (!result.success) {
          throw new Error('Profil bilgileri dogrulanamadi')
        }
        refreshWithSuccess('Profil bilgileri guncellendi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Profil guncellenemedi')
      }
    })
  }

  function handlePasswordSubmit() {
    startTransition(async () => {
      try {
        const result = await changePasswordAction(passwordForm)
        if (!result.success) {
          throw new Error('Sifre alanlari dogrulanamadi')
        }
        setPasswordForm({
          currentPassword: '',
          nextPassword: '',
          confirmPassword: '',
        })
        refreshWithSuccess('Sifre basariyla degistirildi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Sifre degistirilemedi')
      }
    })
  }

  function handleCreateUser() {
    startTransition(async () => {
      try {
        const result = await createUserAccountAction({
          ...createUserForm,
          status: createUserForm.status as 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'ARCHIVED',
        })
        if (!result.success) {
          throw new Error('Yeni kullanici bilgileri dogrulanamadi')
        }
        setCreateUserForm({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          roleId: roles[0]?.id ?? '',
          status: 'INVITED',
        })
        refreshWithSuccess('Yeni kullanici olusturuldu')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Kullanici olusturulamadi')
      }
    })
  }

  return (
    <Tabs defaultValue="profile" className="gap-6">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
        <TabsTrigger value="profile">Profil</TabsTrigger>
        <TabsTrigger value="security">Guvenlik</TabsTrigger>
        <TabsTrigger value="users" disabled={!canManageUsers}>
          Kullanicilar
        </TabsTrigger>
        <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Profil Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span>Ad</span>
              <Input
                value={profileForm.firstName}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    firstName: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-2 text-sm">
              <span>Soyad</span>
              <Input
                value={profileForm.lastName}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    lastName: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-2 text-sm md:col-span-2">
              <span>E-posta</span>
              <Input
                type="email"
                value={profileForm.email}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </label>
            <div className="flex items-center justify-between gap-3 md:col-span-2">
              <div className="flex flex-wrap gap-2">
                {currentUser.roles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))}
              </div>
              <Button onClick={handleProfileSubmit} disabled={isPending}>
                {isPending ? 'Kaydediliyor...' : 'Profili Kaydet'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Sifre Degistir</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm md:col-span-2">
              <span>Mevcut Sifre</span>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    currentPassword: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-2 text-sm">
              <span>Yeni Sifre</span>
              <Input
                type="password"
                value={passwordForm.nextPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    nextPassword: event.target.value,
                  }))
                }
              />
            </label>
            <label className="space-y-2 text-sm">
              <span>Yeni Sifre Tekrar</span>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
              />
            </label>
            <div className="flex justify-end md:col-span-2">
              <Button onClick={handlePasswordSubmit} disabled={isPending}>
                {isPending ? 'Guncelleniyor...' : 'Sifreyi Degistir'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="users">
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Kullanici Yonetimi</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanici</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">Guncelleme</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const isRowPending = isPending && pendingUserId === user.id

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="min-w-36">
                          <InlineSelectField
                            value={user.status}
                            onValueChange={(value) =>
                              updateUserStatus(user.id, value as (typeof userStatuses)[number])
                            }
                            disabled={isRowPending}
                            ariaLabel={`${user.name} durumunu degistir`}
                            options={userStatuses.map((status) => ({
                              value: status,
                              label: status,
                            }))}
                          />
                        </TableCell>
                        <TableCell className="min-w-40">
                          <InlineSelectField
                            value={user.roleSlugs[0] ?? roles[0]?.slug ?? ''}
                            onValueChange={(value) => updateUserRole(user.id, value)}
                            disabled={isRowPending}
                            ariaLabel={`${user.name} rolunu degistir`}
                            options={roles.map((role) => ({
                              value: role.slug,
                              label: role.name,
                            }))}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={isRowPending ? 'warning' : 'secondary'}>
                            {isRowPending ? 'Isleniyor' : 'Guncel'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yeni Kullanici Olustur</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <label className="space-y-2 text-sm">
                <span>Ad</span>
                <Input
                  value={createUserForm.firstName}
                  onChange={(event) =>
                    setCreateUserForm((current) => ({
                      ...current,
                      firstName: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>Soyad</span>
                <Input
                  value={createUserForm.lastName}
                  onChange={(event) =>
                    setCreateUserForm((current) => ({
                      ...current,
                      lastName: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>E-posta</span>
                <Input
                  type="email"
                  value={createUserForm.email}
                  onChange={(event) =>
                    setCreateUserForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>Gecici Sifre</span>
                <Input
                  type="password"
                  value={createUserForm.password}
                  onChange={(event) =>
                    setCreateUserForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <span>Rol</span>
                  <InlineSelectField
                    value={createUserForm.roleId}
                    onValueChange={(value) =>
                      setCreateUserForm((current) => ({
                        ...current,
                        roleId: value,
                      }))
                    }
                    ariaLabel="Yeni kullanici rolunu sec"
                    options={roles.map((role) => ({
                      value: role.id,
                      label: role.name,
                    }))}
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <span>Durum</span>
                  <InlineSelectField
                    value={createUserForm.status}
                    onValueChange={(value) =>
                      setCreateUserForm((current) => ({
                        ...current,
                        status: value,
                      }))
                    }
                    ariaLabel="Yeni kullanici durumunu sec"
                    options={userStatuses.map((status) => ({
                      value: status,
                      label: status,
                    }))}
                  />
                </div>
              </div>
              <Button onClick={handleCreateUser} disabled={isPending}>
                {isPending ? 'Olusturuluyor...' : 'Kullanici Olustur'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="pipeline">
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader><CardTitle>Sistem Ozeti</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>{overview.counts.companies} firma</p>
                <p>{overview.counts.contacts} kisi</p>
                <p>{overview.counts.deals} deal</p>
                <p>{overview.counts.tasks} gorev</p>
              </CardContent>
            </Card>
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Pipeline Yonetimi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Pipeline isimlerini, stage olasiliklarini ve sira duzenini bu alandan yonetin.</p>
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/pipeline">Pipeline ekranina git</Link>}
                />
              </CardContent>
            </Card>
          </div>

          {overview.pipelines.map((pipeline) => (
            <Card key={pipeline.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  <span>{pipeline.isDefault ? `${pipeline.name} (Varsayilan)` : pipeline.name}</span>
                  <Badge variant={pipeline.isDefault ? 'success' : 'secondary'}>
                    {pipeline.stages.length} stage
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
                    disabled={isPending && pendingPipelineId === pipeline.id}
                  >
                    Pipeline Adini Kaydet
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
                                probability: current[stage.id]?.probability ?? String(stage.probability),
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
                            Stage Kaydet
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3 md:flex-row">
                  <Input
                    placeholder="Yeni stage adi"
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
                    Stage Ekle
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
