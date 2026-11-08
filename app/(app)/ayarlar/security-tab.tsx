'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { changePasswordAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useServerActionToast } from '@/hooks/use-server-action-toast'
import { passwordPolicyDescription, strongPasswordSchema } from '@/lib/validation/password'
import { ErrorText } from './settings-shared'

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(8, 'Mevcut sifre en az 8 karakter olmali'),
    nextPassword: strongPasswordSchema(passwordPolicyDescription),
    confirmPassword: z.string().min(8, 'Tekrar alanini doldurun'),
  })
  .refine((value) => value.nextPassword === value.confirmPassword, {
    message: 'Sifreler eslesmiyor',
    path: ['confirmPassword'],
  })

export function SecurityTab() {
  const { isPending, runServerAction } = useServerActionToast()

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
      successMessage: 'Sifre basariyla degistirildi',
      errorMessage: 'Sifre degistirilemedi',
      onSuccess: () => {
        passwordForm.reset()
      },
    })
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sifre Degistir</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm md:col-span-2">
            <span>Mevcut Sifre</span>
            <Input type="password" {...passwordForm.register('currentPassword')} />
            <ErrorText message={passwordForm.formState.errors.currentPassword?.message} />
          </label>
          <label className="space-y-2 text-sm">
            <span>Yeni Sifre</span>
            <Input type="password" {...passwordForm.register('nextPassword')} />
            <ErrorText message={passwordForm.formState.errors.nextPassword?.message} />
          </label>
          <label className="space-y-2 text-sm">
            <span>Yeni Sifre Tekrar</span>
            <Input type="password" {...passwordForm.register('confirmPassword')} />
            <ErrorText message={passwordForm.formState.errors.confirmPassword?.message} />
          </label>
          <div className="flex justify-end md:col-span-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guncelleniyor...' : 'Sifreyi Degistir'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
