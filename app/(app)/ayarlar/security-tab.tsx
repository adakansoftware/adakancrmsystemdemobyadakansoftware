'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { changePasswordAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/components/i18n/locale-provider'
import { Input } from '@/components/ui/input'
import { useServerActionToast } from '@/hooks/use-server-action-toast'
import { passwordPolicyDescription, strongPasswordSchema } from '@/lib/validation/password'
import { ErrorText } from './settings-shared'

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(8, 'validation.currentPasswordMin'),
    nextPassword: strongPasswordSchema(passwordPolicyDescription),
    confirmPassword: z.string().min(8, 'validation.confirmPasswordRequired'),
  })
  .refine((value) => value.nextPassword === value.confirmPassword, {
    message: 'validation.passwordsDoNotMatch',
    path: ['confirmPassword'],
  })

export function SecurityTab() {
  const { isPending, runServerAction } = useServerActionToast()
  const { t } = useI18n()

  const passwordForm = useForm({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      nextPassword: '',
      confirmPassword: '',
    },
  })

  const handlePasswordSubmit = passwordForm.handleSubmit((values) => {
    runServerAction(() => changePasswordAction(values), {
      successMessage: t('settings.passwordChanged'),
      errorMessage: t('settings.passwordChangeFailed'),
      onSuccess: () => {
        passwordForm.reset()
      },
    })
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.changePassword')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm md:col-span-2">
            <span>{t('settings.currentPassword')}</span>
            <Input type="password" {...passwordForm.register('currentPassword')} />
            <ErrorText message={passwordForm.formState.errors.currentPassword?.message} />
          </label>
          <label className="space-y-2 text-sm">
            <span>{t('settings.newPassword')}</span>
            <Input type="password" {...passwordForm.register('nextPassword')} />
            <ErrorText message={passwordForm.formState.errors.nextPassword?.message} />
          </label>
          <label className="space-y-2 text-sm">
            <span>{t('settings.confirmPassword')}</span>
            <Input type="password" {...passwordForm.register('confirmPassword')} />
            <ErrorText message={passwordForm.formState.errors.confirmPassword?.message} />
          </label>
          <div className="flex justify-end md:col-span-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.updating') : t('settings.changePassword')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
