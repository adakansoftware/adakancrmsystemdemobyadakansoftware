import { listUsersWithRoles } from '@/app/actions/auth'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminPage() {
  const users = await listUsersWithRoles()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admin"
        description="Kullanıcı ve yetki görünümü"
      />
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Özeti</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              <div className="flex flex-wrap gap-2">
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
