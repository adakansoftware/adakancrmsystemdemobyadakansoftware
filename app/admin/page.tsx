import { listUsersWithRoles } from '@/app/actions/auth'
import { PageHeader } from '@/components/shared/page-header'
import { SummaryCard } from '@/components/shared/summary-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminPage() {
  const users = await listUsersWithRoles()
  const activeUsers = users.filter((user) => user.status === 'ACTIVE').length
  const invitedUsers = users.filter((user) => user.status === 'INVITED').length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admin"
        description="Kullanici, rol ve yetki gorunumu"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Toplam Kullanici" value={users.length} />
        <SummaryCard label="Aktif Kullanici" value={activeUsers} />
        <SummaryCard label="Bekleyen Davet" value={invitedUsers} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kullanici Ozeti</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{user.status}</Badge>
                {user.roles.map((entry) => (
                  <Badge key={entry.roleId} variant="secondary">
                    {entry.role.name}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
