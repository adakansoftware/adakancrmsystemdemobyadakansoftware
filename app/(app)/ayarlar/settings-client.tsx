'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  assignRoleAction,
  changePasswordAction,
  createUserAccountAction,
  removeRoleAction,
  updateProfileAction,
  updateUserStatusAction,
} from '@/app/actions/auth'
import {
  createStageAction,
  createTagAction,
  deleteTagAction,
  updatePipelineAction,
  updateStageAction,
  updateTagAction,
} from '@/app/actions/crm'
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
    tags: Array<{
      id: string
      name: string
      color: string
      _count: {
        companies: number
        contacts: number
        deals: number
      }
    }>
  }
}

const userStatuses = ['ACTIVE', 'INVITED', 'SUSPENDED', 'ARCHIVED'] as const

const profileFormSchema = z.object({
  firstName: z.string().trim().min(1, 'Ad zorunlu'),
  lastName: z.string().trim().min(1, 'Soyad zorunlu'),
  email: z.email('Gecerli bir e-posta girin'),
})

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(8, 'Mevcut sifre en az 8 karakter olmali'),
    nextPassword: z.string().min(8, 'Yeni sifre en az 8 karakter olmali'),
    confirmPassword: z.string().min(8, 'Tekrar alanini doldurun'),
  })
  .refine((value) => value.nextPassword === value.confirmPassword, {
    message: 'Sifreler eslesmiyor',
    path: ['confirmPassword'],
  })

const createUserFormSchema = z.object({
  firstName: z.string().trim().min(1, 'Ad zorunlu'),
  lastName: z.string().trim().min(1, 'Soyad zorunlu'),
  email: z.email('Gecerli bir e-posta girin'),
  password: z.string().min(8, 'Sifre en az 8 karakter olmali'),
  roleId: z.string().min(1, 'Rol secin'),
  status: z.enum(userStatuses),
})

const tagFormSchema = z.object({
  name: z.string().trim().min(2, 'Etiket adi en az 2 karakter olmali'),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Hex renk girin'),
})

function ErrorText({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-xs text-destructive">{message}</p>
}

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
  const [pendingTagId, setPendingTagId] = useState<string | null>(null)
  const [createUserRoleId, setCreateUserRoleId] = useState(roles[0]?.id ?? '')
  const [createUserStatus, setCreateUserStatus] = useState<(typeof userStatuses)[number]>('INVITED')
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
  const [tagEdits, setTagEdits] = useState<Record<string, { name: string; color: string }>>(
    Object.fromEntries(
      overview.tags.map((tag) => [tag.id, { name: tag.name, color: tag.color }]),
    ),
  )

  const [firstName = '', lastName = ''] = currentUser.name.split(' ')

  const profileForm = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName,
      lastName,
      email: currentUser.email,
    },
  })

  const passwordForm = useForm({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      nextPassword: '',
      confirmPassword: '',
    },
  })

  const createUserForm = useForm({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      roleId: roles[0]?.id ?? '',
      status: 'INVITED' as const,
    },
  })

  const createTagForm = useForm({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: '',
      color: '#6366f1',
    },
  })

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

        const assignResult = await assignRoleAction({ userId, roleId: nextRole.id })
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

  const handleProfileSubmit = profileForm.handleSubmit((values) => {
    startTransition(async () => {
      try {
        const result = await updateProfileAction(values)
        if (!result.success) {
          throw new Error('Profil bilgileri dogrulanamadi')
        }
        refreshWithSuccess('Profil bilgileri guncellendi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Profil guncellenemedi')
      }
    })
  })

  const handlePasswordSubmit = passwordForm.handleSubmit((values) => {
    startTransition(async () => {
      try {
        const result = await changePasswordAction(values)
        if (!result.success) {
          throw new Error('Sifre alanlari dogrulanamadi')
        }
        passwordForm.reset()
        refreshWithSuccess('Sifre basariyla degistirildi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Sifre degistirilemedi')
      }
    })
  })

  const handleCreateUser = createUserForm.handleSubmit((values) => {
    startTransition(async () => {
      try {
        const result = await createUserAccountAction({
          ...values,
          roleId: createUserRoleId,
          status: createUserStatus,
        })
        if (!result.success) {
          throw new Error('Yeni kullanici bilgileri dogrulanamadi')
        }
        createUserForm.reset({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          roleId: roles[0]?.id ?? '',
          status: 'INVITED',
        })
        setCreateUserRoleId(roles[0]?.id ?? '')
        setCreateUserStatus('INVITED')
        refreshWithSuccess('Yeni kullanici olusturuldu')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Kullanici olusturulamadi')
      }
    })
  })

  const handleCreateTag = createTagForm.handleSubmit((values) => {
    startTransition(async () => {
      try {
        const result = await createTagAction(values)
        if (!result.success) {
          throw new Error('Etiket olusturulamadi')
        }
        createTagForm.reset({
          name: '',
          color: '#6366f1',
        })
        refreshWithSuccess('Etiket olusturuldu')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Etiket olusturulamadi')
      }
    })
  })

  function saveTag(tagId: string) {
    const values = tagEdits[tagId]
    if (!values) {
      return
    }

    const parsed = tagFormSchema.safeParse(values)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Etiket alanlari gecersiz')
      return
    }

    startTransition(async () => {
      try {
        setPendingTagId(tagId)
        const result = await updateTagAction({
          id: tagId,
          ...parsed.data,
        })
        if (!result.success) {
          throw new Error('Etiket guncellenemedi')
        }
        refreshWithSuccess('Etiket guncellendi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Etiket guncellenemedi')
      } finally {
        setPendingTagId(null)
      }
    })
  }

  function removeTag(tagId: string) {
    startTransition(async () => {
      try {
        setPendingTagId(tagId)
        const result = await deleteTagAction({ id: tagId })
        if (!result.success) {
          throw new Error('Etiket silinemedi')
        }
        refreshWithSuccess('Etiket silindi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Etiket silinemedi')
      } finally {
        setPendingTagId(null)
      }
    })
  }

  return (
    <Tabs defaultValue="profile" className="gap-6">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
        <TabsTrigger value="profile">Profil</TabsTrigger>
        <TabsTrigger value="security">Guvenlik</TabsTrigger>
        <TabsTrigger value="users" disabled={!canManageUsers}>
          Kullanicilar
        </TabsTrigger>
        <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        <TabsTrigger value="tags">Etiketler</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Profil Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span>Ad</span>
                <Input {...profileForm.register('firstName')} />
                <ErrorText message={profileForm.formState.errors.firstName?.message} />
              </label>
              <label className="space-y-2 text-sm">
                <span>Soyad</span>
                <Input {...profileForm.register('lastName')} />
                <ErrorText message={profileForm.formState.errors.lastName?.message} />
              </label>
              <label className="space-y-2 text-sm md:col-span-2">
                <span>E-posta</span>
                <Input type="email" {...profileForm.register('email')} />
                <ErrorText message={profileForm.formState.errors.email?.message} />
              </label>
              <div className="flex items-center justify-between gap-3 md:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {currentUser.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))}
                </div>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Kaydediliyor...' : 'Profili Kaydet'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Sifre Degistir</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm md:col-span-2">
                <span>Mevcut Sifre</span>
                <Input type="password" {...passwordForm.register('currentPassword')} />
                <ErrorText message={passwordForm.formState.errors.currentPassword?.message} />
              </label>
              <label className="space-y-2 text-sm">
                <span>Yeni Sifre</span>
                <Input type="password" {...passwordForm.register('nextPassword')} />
                <ErrorText message={passwordForm.formState.errors.nextPassword?.message} />
              </label>
              <label className="space-y-2 text-sm">
                <span>Yeni Sifre Tekrar</span>
                <Input type="password" {...passwordForm.register('confirmPassword')} />
                <ErrorText message={passwordForm.formState.errors.confirmPassword?.message} />
              </label>
              <div className="flex justify-end md:col-span-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Guncelleniyor...' : 'Sifreyi Degistir'}
                </Button>
              </div>
            </form>
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
            <CardContent>
              <form onSubmit={handleCreateUser} className="grid gap-4">
                <label className="space-y-2 text-sm">
                  <span>Ad</span>
                  <Input {...createUserForm.register('firstName')} />
                  <ErrorText message={createUserForm.formState.errors.firstName?.message} />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Soyad</span>
                  <Input {...createUserForm.register('lastName')} />
                  <ErrorText message={createUserForm.formState.errors.lastName?.message} />
                </label>
                <label className="space-y-2 text-sm">
                  <span>E-posta</span>
                  <Input type="email" {...createUserForm.register('email')} />
                  <ErrorText message={createUserForm.formState.errors.email?.message} />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Gecici Sifre</span>
                  <Input type="password" {...createUserForm.register('password')} />
                  <ErrorText message={createUserForm.formState.errors.password?.message} />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 text-sm">
                    <span>Rol</span>
                    <InlineSelectField
                      value={createUserRoleId}
                      onValueChange={(value) => setCreateUserRoleId(value)}
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
                      value={createUserStatus}
                      onValueChange={(value) => setCreateUserStatus(value as (typeof userStatuses)[number])}
                      ariaLabel="Yeni kullanici durumunu sec"
                      options={userStatuses.map((status) => ({
                        value: status,
                        label: status,
                      }))}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Olusturuluyor...' : 'Kullanici Olustur'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="pipeline">
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Sistem Ozeti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>{overview.counts.companies} firma</p>
                <p>{overview.counts.contacts} kisi</p>
                <p>{overview.counts.deals} deal</p>
                <p>{overview.counts.tasks} gorev</p>
                <p>{overview.tags.length} etiket</p>
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

      <TabsContent value="tags">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Etiket Kutuphanesi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview.tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henuz etiket yok.</p>
              ) : (
                overview.tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="grid gap-3 rounded-lg border p-3 lg:grid-cols-[minmax(0,1fr)_140px_auto]"
                  >
                    <Input
                      value={tagEdits[tag.id]?.name ?? tag.name}
                      onChange={(event) =>
                        setTagEdits((current) => ({
                          ...current,
                          [tag.id]: {
                            name: event.target.value,
                            color: current[tag.id]?.color ?? tag.color,
                          },
                        }))
                      }
                    />
                    <Input
                      value={tagEdits[tag.id]?.color ?? tag.color}
                      onChange={(event) =>
                        setTagEdits((current) => ({
                          ...current,
                          [tag.id]: {
                            name: current[tag.id]?.name ?? tag.name,
                            color: event.target.value,
                          },
                        }))
                      }
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {tag._count.companies + tag._count.contacts + tag._count.deals} bag
                      </Badge>
                      <Button onClick={() => saveTag(tag.id)} disabled={isPending && pendingTagId === tag.id}>
                        Kaydet
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => removeTag(tag.id)}
                        disabled={isPending && pendingTagId === tag.id}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yeni Etiket</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTag} className="grid gap-4">
                <label className="space-y-2 text-sm">
                  <span>Etiket Adi</span>
                  <Input {...createTagForm.register('name')} />
                  <ErrorText message={createTagForm.formState.errors.name?.message} />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Renk</span>
                  <Input {...createTagForm.register('color')} />
                  <ErrorText message={createTagForm.formState.errors.color?.message} />
                </label>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Olusturuluyor...' : 'Etiket Olustur'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}
