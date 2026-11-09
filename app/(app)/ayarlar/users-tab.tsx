'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  assignRoleAction,
  createUserAccountAction,
  removeRoleAction,
  updateUserStatusAction,
} from '@/app/actions/auth'
import { InlineSelectField } from '@/components/crm/inline-select-field'
import { useI18n } from '@/components/i18n/locale-provider'
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
import { useOptimisticRowAction } from '@/hooks/use-optimistic-row-action'
import { useServerActionToast } from '@/hooks/use-server-action-toast'
import {
  userStatuses,
  type SettingsRoleOption,
  type SettingsUserRow,
} from '@/lib/crm/settings-view-models'
import { passwordPolicyDescription, strongPasswordSchema } from '@/lib/validation/password'
import { ErrorText } from './settings-shared'

const createUserFormSchema = z.object({
  firstName: z.string().trim().min(1, 'Ad zorunlu'),
  lastName: z.string().trim().min(1, 'Soyad zorunlu'),
  email: z.email('Gecerli bir e-posta girin'),
  password: strongPasswordSchema(passwordPolicyDescription),
  roleId: z.string().min(1, 'Rol secin'),
  status: z.enum(userStatuses),
})

type UsersTabProps = {
  users: SettingsUserRow[]
  roles: SettingsRoleOption[]
}

export function UsersTab({ users, roles }: UsersTabProps) {
  const { isPending, runServerAction } = useServerActionToast()
  const { t } = useI18n()
  const userActions = useOptimisticRowAction<string>()
  const [createUserRoleId, setCreateUserRoleId] = useState(roles[0]?.id ?? '')
  const [createUserStatus, setCreateUserStatus] = useState<(typeof userStatuses)[number]>('INVITED')

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

  function updateUserRole(userId: string, nextSlug: string) {
    const user = users.find((entry) => entry.id === userId)
    const nextRole = roles.find((role) => role.slug === nextSlug)

    if (!user || !nextRole) {
      return
    }

    userActions.runRowAction(
      userId,
      async () => {
        for (const roleId of user.roleIds) {
          const removeResult = await removeRoleAction({ userId, roleId })
          if (!removeResult.success) {
            throw new Error(t('settings.rolesClearFailed'))
          }
        }

        const assignResult = await assignRoleAction({ userId, roleId: nextRole.id })
        if (!assignResult.success) {
          throw new Error(t('settings.roleAssignFailed'))
        }
        return assignResult
      },
      {
        successMessage: t('settings.roleUpdated'),
        errorMessage: t('settings.roleUpdateFailed'),
      },
    )
  }

  function updateUserStatus(userId: string, status: (typeof userStatuses)[number]) {
    userActions.runRowAction(userId, () => updateUserStatusAction({ userId, status }), {
      successMessage: t('settings.userStatusUpdated'),
      errorMessage: t('settings.userStatusUpdateFailed'),
    })
  }

  const handleCreateUser = createUserForm.handleSubmit((values) => {
    runServerAction(
      () =>
        createUserAccountAction({
          ...values,
          roleId: createUserRoleId,
          status: createUserStatus,
        }),
      {
        successMessage: t('settings.userCreated'),
        errorMessage: t('settings.userCreateFailed'),
        onSuccess: () => {
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
        },
      },
    )
  })

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.userManagement')}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('settings.colUser')}</TableHead>
                <TableHead>{t('common.colStatus')}</TableHead>
                <TableHead>{t('settings.role')}</TableHead>
                <TableHead className="text-right">{t('settings.colUpdate')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const rowPending = userActions.isRowPending(user.id)

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
                        disabled={rowPending}
                        ariaLabel={t('settings.changeStatusAria', { name: user.name })}
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
                        disabled={rowPending}
                        ariaLabel={t('settings.changeRoleAria', { name: user.name })}
                        options={roles.map((role) => ({
                          value: role.slug,
                          label: role.name,
                        }))}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={rowPending ? 'warning' : 'secondary'}>
                        {rowPending ? t('common.processing') : t('common.upToDate')}
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
          <CardTitle>{t('settings.createUser')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="grid gap-4">
            <label className="space-y-2 text-sm">
              <span>{t('contacts.firstName')}</span>
              <Input {...createUserForm.register('firstName')} />
              <ErrorText message={createUserForm.formState.errors.firstName?.message} />
            </label>
            <label className="space-y-2 text-sm">
              <span>{t('contacts.lastName')}</span>
              <Input {...createUserForm.register('lastName')} />
              <ErrorText message={createUserForm.formState.errors.lastName?.message} />
            </label>
            <label className="space-y-2 text-sm">
              <span>{t('contacts.email')}</span>
              <Input type="email" {...createUserForm.register('email')} />
              <ErrorText message={createUserForm.formState.errors.email?.message} />
            </label>
            <label className="space-y-2 text-sm">
              <span>{t('settings.tempPassword')}</span>
              <Input type="password" {...createUserForm.register('password')} />
              <ErrorText message={createUserForm.formState.errors.password?.message} />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-sm">
                <span>{t('settings.role')}</span>
                <InlineSelectField
                  value={createUserRoleId}
                  onValueChange={(value) => setCreateUserRoleId(value)}
                  ariaLabel={t('settings.newUserRoleAria')}
                  options={roles.map((role) => ({
                    value: role.id,
                    label: role.name,
                  }))}
                />
              </div>
              <div className="space-y-2 text-sm">
                <span>{t('common.colStatus')}</span>
                <InlineSelectField
                  value={createUserStatus}
                  onValueChange={(value) => setCreateUserStatus(value as (typeof userStatuses)[number])}
                  ariaLabel={t('settings.newUserStatusAria')}
                  options={userStatuses.map((status) => ({
                    value: status,
                    label: status,
                  }))}
                />
              </div>
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.creating') : t('settings.createUserButton')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
