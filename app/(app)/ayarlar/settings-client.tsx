'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { assignRoleAction, removeRoleAction } from '@/app/actions/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export function SettingsClient({
  currentUser,
  canManageUsers,
  users,
  roles,
}: SettingsClientProps) {
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function updateUserRole(userId: string, nextSlug: string) {
    const user = users.find((entry) => entry.id === userId)
    const nextRole = roles.find((role) => role.slug === nextSlug)

    if (!user || !nextRole) {
      return
    }

    startTransition(async () => {
      try {
        setPendingUserId(userId)
        for (let index = 0; index < user.roleIds.length; index += 1) {
          await removeRoleAction({
            userId,
            roleId: user.roleIds[index],
          })
        }

        const roleId = roles.find((role) => role.slug === nextSlug)?.id

        if (!roleId) {
          throw new Error('Rol kimliği bulunamadı')
        }

        await assignRoleAction({
          userId,
          roleId,
        })

        toast.success('Kullanıcı rolü güncellendi')
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Rol güncellemesi başarısız oldu',
        )
      } finally {
        setPendingUserId(null)
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
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Ad Soyad</p>
              <p className="font-medium">{currentUser.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">E-posta</p>
              <p className="font-medium">{currentUser.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Yetkiler</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {currentUser.roles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Güvenlik Durumu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Oturum koruması, rol bazlı erişim ve audit log aktif durumda.</p>
            <p>
              Parola değişimi için bir sonraki sertleştirme fazında ayrı kullanıcı
              aksiyonları eklenecek.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="users">
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
                    <TableCell>
                      <Badge variant="outline">{user.status}</Badge>
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
                        {isPending && pendingUserId === user.id ? 'Güncelleniyor' : 'Hazır'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
              Sürükle-bırak stage sıralama yönetimi ayrı üretim sertleştirme fazında
              genişletilecek.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
