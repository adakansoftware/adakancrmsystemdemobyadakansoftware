import { listUsersWithRoles } from '@/app/actions/auth'
import { PageHeader } from '@/components/shared/page-header'
import { SummaryCard } from '@/components/shared/summary-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db/prisma'
import { getRuntimeHealthSummary } from '@/lib/health-runtime'
import { formatDateTime } from '@/lib/format'

export default async function AdminPage() {
  const [users, health, activeSessions, todayAuditCount, recentAuditLogs] = await Promise.all([
    listUsersWithRoles(),
    getRuntimeHealthSummary(),
    db.session.count({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
    }),
    db.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    db.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
  ])

  const activeUsers = users.filter((user) => user.status === 'ACTIVE').length
  const invitedUsers = users.filter((user) => user.status === 'INVITED').length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admin"
        description="Kullanici, operasyon ve sistem sagligi gorunumu"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Toplam Kullanici" value={users.length} />
        <SummaryCard label="Aktif Kullanici" value={activeUsers} />
        <SummaryCard label="Bekleyen Davet" value={invitedUsers} />
        <SummaryCard label="Aktif Oturum" value={activeSessions} />
        <SummaryCard label="Bugunku Audit" value={todayAuditCount} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Sistem Sagligi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Genel Durum</p>
                <p className="text-xs text-muted-foreground">
                  Son guncelleme: {formatDateTime(new Date(health.timestamp))}
                </p>
              </div>
              <Badge
                variant={
                  health.status === 'ok'
                    ? 'success'
                    : health.status === 'warn'
                      ? 'warning'
                      : 'destructive'
                }
              >
                {health.status.toUpperCase()}
              </Badge>
            </div>

            <div className="grid gap-3">
              {health.checks.map((check) => (
                <div key={check.key} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{check.key}</p>
                    <p className="text-xs text-muted-foreground">{check.detail}</p>
                  </div>
                  <Badge variant={check.ok ? 'success' : 'warning'}>
                    {check.ok ? 'OK' : 'WARN'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Son Audit Kayitlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAuditLogs.map((log) => (
              <div key={log.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{log.summary}</p>
                  <Badge variant="outline">{log.action}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {(log.actor && `${log.actor.firstName} ${log.actor.lastName}`) || log.actor?.email || 'Sistem'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {log.entityType}
                  {log.entityId ? ` / ${log.entityId}` : ''}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
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
