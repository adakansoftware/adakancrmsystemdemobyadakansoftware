'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { updateProfileAction } from '@/app/actions/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      successMessage: 'Profil bilgileri guncellendi',
      errorMessage: 'Profil guncellenemedi',
    })
  })

  return (
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
  )
}
