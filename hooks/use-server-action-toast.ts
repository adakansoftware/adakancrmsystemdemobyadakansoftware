'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import {
  getFirstValidationError,
  type ValidatedActionResult,
} from '@/lib/actions/create-validated-action'

type RunServerActionOptions<TResult> = {
  successMessage: string
  errorMessage: string
  refresh?: boolean
  onSuccess?: (data: TResult) => void
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage
}

export function useServerActionToast() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function runServerAction<TResult>(
    action: () => Promise<ValidatedActionResult<TResult>>,
    options: RunServerActionOptions<TResult>,
  ) {
    startTransition(async () => {
      try {
        const result = await action()

        if (!result.success) {
          throw new Error(getFirstValidationError(result.errors) ?? options.errorMessage)
        }

        options.onSuccess?.(result.data)
        toast.success(options.successMessage)

        if (options.refresh ?? true) {
          router.refresh()
        }
      } catch (error) {
        toast.error(getErrorMessage(error, options.errorMessage))
      }
    })
  }

  return {
    isPending,
    runServerAction,
  }
}
