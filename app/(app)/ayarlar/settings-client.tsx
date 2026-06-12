'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  assignRoleAction,
  changePasswordAction,
  createUserAccountAction,
  removeRoleAction,
  updateProfileAction,
  updateUserStatusAction,
} from '@/app/actions/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
}

const userStatuses = ['ACTIVE', 'INVITED', 'SUSPENDED', 'ARCHIVED'] as const

export function SettingsClient({
  currentUser,
  canManageUsers,
  users,
  roles,
}: SettingsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
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

  function refreshWithSuccess(message: string) {
    toast.success(message)
    router.refresh()
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
          throw new Error('Yeni rol atanamadı')
        }

        refreshWithSuccess('Kullanıcı rolü güncellendi')
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Rol güncellemesi başarısız oldu',
        )
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
          throw new Error('Kullanıcı durumu doğrulanamadı')
        }
        refreshWithSuccess('Kullanıcı durumu güncellendi')
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Durum güncellemesi başarısız oldu',
        )
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
          throw new Error('Profil bilgileri doğrulanamadı')
        }
        refreshWithSuccess('Profil bilgileri güncellendi')
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Profil güncellenemedi',
        )
      }
    })
  }

  function handlePasswordSubmit() {
    startTransition(async () => {
      try {
        const result = await changePasswordAction(passwordForm)
        if (!result.success) {
          throw new Error('Şifre alanları doğrulanamadı')
        }
        setPasswordForm({
          currentPassword: '',
          nextPassword: '',
          confirmPassword: '',
        })
        refreshWithSuccess('Şifre başarıyla değiştirildi')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Şifre değiştirilemedi')
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
          throw new Error('Yeni kullanıcı bilgileri doğrulanamadı')
        }
        setCreateUserForm({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          roleId: roles[0]?.id ?? '',
          status: 'INVITED',
        })
        refreshWithSuccess('Yeni kullanıcı oluşturuldu')
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Kullanıcı oluşturulamadı',
        )
      }
    })
  }

  return (
    <Tabs defaultValue="profile" className="gap-6">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
        <TabsTrigger value="profile">Profil</TabsTrigger>
        <TabsTrigger value="security">Güvenlik</TabsTrigger>
        <TabsTrigger value="users" disabled={!canManageUsers}>
          Kullanıcılar
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
            <div className="md:col-span-2 flex items-center justify-between gap-3">
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
            <CardTitle>Şifre Değiştir</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm md:col-span-2">
              <span>Mevcut Şifre</span>
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
              <span>Yeni Şifre</span>
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
              <span>Yeni Şifre Tekrar</span>
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
            <div className="md:col-span-2 flex justify-end">
              <Button onClick={handlePasswordSubmit} disabled={isPending}>
                {isPending ? 'Güncelleniyor...' : 'Şifreyi Değiştir'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="users">
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Kullanıcı Yönetimi</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-36">
                        <Select
                          defaultValue={user.status}
                          onValueChange={(value) =>
                            value &&
                            updateUserStatus(
                              user.id,
                              value as (typeof userStatuses)[number],
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {userStatuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="min-w-40">
                        <Select
                          defaultValue={user.roleSlugs[0]}
                          onValueChange={(value) => value && updateUserRole(user.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {roles.map((role) => (
                                <SelectItem key={role.slug} value={role.slug}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending && pendingUserId === user.id}
                        >
                          {isPending && pendingUserId === user.id ? 'İşleniyor' : 'Hazır'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yeni Kullanıcı Oluştur</CardTitle>
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
                <span>Geçici Şifre</span>
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
                  <Select
                    value={createUserForm.roleId}
                    onValueChange={(value) =>
                      setCreateUserForm((current) => ({
                        ...current,
                        roleId: value ?? '',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-sm">
                  <span>Durum</span>
                  <Select
                    value={createUserForm.status}
                    onValueChange={(value) =>
                      setCreateUserForm((current) => ({
                        ...current,
                        status: value ?? 'INVITED',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {userStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreateUser} disabled={isPending}>
                {isPending ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="pipeline">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Durumu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Çoklu pipeline, stage hareket geçmişi ve değer takibi şu anda aktif
              çalışıyor.
            </p>
            <p>
              Bir sonraki ürünleşme turunda stage sıralama, pipeline kuralları ve
              gelişmiş yönetim ekranı genişletilecek.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
