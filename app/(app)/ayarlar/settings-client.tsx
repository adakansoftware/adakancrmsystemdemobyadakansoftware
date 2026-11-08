'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { SettingsClientProps } from '@/lib/crm/settings-view-models'
import { PipelineTab } from './pipeline-tab'
import { ProfileTab } from './profile-tab'
import { SecurityTab } from './security-tab'
import { TagsTab } from './tags-tab'
import { UsersTab } from './users-tab'

export function SettingsClient({
  currentUser,
  canManageUsers,
  users,
  roles,
  overview,
}: SettingsClientProps) {
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
        <ProfileTab currentUser={currentUser} />
      </TabsContent>
      <TabsContent value="security">
        <SecurityTab />
      </TabsContent>
      <TabsContent value="users">
        <UsersTab users={users} roles={roles} />
      </TabsContent>
      <TabsContent value="pipeline">
        <PipelineTab overview={overview} />
      </TabsContent>
      <TabsContent value="tags">
        <TagsTab tags={overview.tags} />
      </TabsContent>
    </Tabs>
  )
}
