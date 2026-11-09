'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { useI18n } from '@/components/i18n/locale-provider'
import {
  getFirstValidationError,
  type ValidatedActionResult,
} from '@/lib/actions/create-validated-action'
import { translateMessage } from '@/lib/i18n'

type RunServerActionOptions<TResult> = {
  successMessage: string
  errorMessage: string
  refresh?: boolean
  onSuccess?: (data: TResult) => void
}

// Internal errors (Prisma query internals, framework digests, raw permission
// details) must never surface to the client. Only deliberately user-facing
// messages thrown by server actions are shown.
const INTERNAL_ERROR_PATTERNS: RegExp[] = [
  /^Invalid `/,
  /PrismaClient\w*Error/,
  /^Forbidden:/,
  /NEXT_REDIRECT/i,
  /^Error: Minified React error/i,
]

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) {
    const message = error.message

    if (message && !INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
      return message
    }
  }

  return fallbackMessage
}

export function useServerActionToast() {
  const router = useRouter()
  const { t } = useI18n()
  const [isPending, startTransition] = useTransition()

  function runServerAction<TResult>(
    action: () => Promise<ValidatedActionResult<TResult>>,
    options: RunServerActionOptions<TResult>,
  ) {
    startTransition(async () => {
      try {
        const result = await action()

        if (!result.success) {
          throw new Error(
            translateMessage(t, getFirstValidationError(result.errors) ?? options.errorMessage),
          )
        }

        options.onSuccess?.(result.data)
        toast.success(options.successMessage)

        if (options.refresh ?? true) {
          router.refresh()
        }
      } catch (error) {
        toast.error(translateMessage(t, getErrorMessage(error, options.errorMessage)))
      }
    })
  }

  return {
    isPending,
    runServerAction,
  }
}
