'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { updateProfileAction } from '@/app/actions/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/components/i18n/locale-provider'
import { Input } from '@/components/ui/input'
import { useServerActionToast } from '@/hooks/use-server-action-toast'
import type { SettingsCurrentUser } from '@/lib/crm/settings-view-models'
import { ErrorText } from './settings-shared'

const profileFormSchema = z.object({
  firstName: z.string().trim().min(1, 'Ad zorunlu'),
  lastName: z.string().trim().min(1, 'Soyad zorunlu'),
  email: z.email('Gecerli bir e-posta girin'),
})

export function ProfileTab({ currentUser }: { currentUser: SettingsCurrentUser }) {
  const { isPending, runServerAction } = useServerActionToast()
  const { t } = useI18n()
  const [firstName = '', lastName = ''] = currentUser.name.split(' ')

  const profileForm = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName,
      lastName,
      email: currentUser.email,
    },
  })

  const handleProfileSubmit = profileForm.handleSubmit((values) => {
    runServerAction(() => updateProfileAction(values), {
      successMessage: t('settings.profileUpdated'),
      errorMessage: t('settings.profileUpdateFailed'),
    })
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.profileInfo')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleProfileSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span>{t('contacts.firstName')}</span>
            <Input {...profileForm.register('firstName')} />
            <ErrorText message={profileForm.formState.errors.firstName?.message} />
          </label>
          <label className="space-y-2 text-sm">
            <span>{t('contacts.lastName')}</span>
            <Input {...profileForm.register('lastName')} />
            <ErrorText message={profileForm.formState.errors.lastName?.message} />
          </label>
          <label className="space-y-2 text-sm md:col-span-2">
            <span>{t('contacts.email')}</span>
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
              {isPending ? t('common.saving') : t('settings.saveProfile')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
