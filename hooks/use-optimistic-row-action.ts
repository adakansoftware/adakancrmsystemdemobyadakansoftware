'use client'

import { useState } from 'react'
import { type ValidatedActionResult } from '@/lib/actions/create-validated-action'
import { useServerActionToast } from '@/hooks/use-server-action-toast'

type RunRowActionOptions<TResult> = {
  successMessage: string
  errorMessage: string
  refresh?: boolean
  onSuccess?: (data: TResult) => void
}

export function useOptimisticRowAction<TKey extends string>() {
  const [pendingRowId, setPendingRowId] = useState<TKey | null>(null)
  const { isPending, runServerAction } = useServerActionToast()

  function runRowAction<TResult>(
    rowId: TKey,
    action: () => Promise<ValidatedActionResult<TResult>>,
    options: RunRowActionOptions<TResult>,
  ) {
    runServerAction(
      async () => {
        setPendingRowId(rowId)

        try {
          return await action()
        } finally {
          setPendingRowId(null)
        }
      },
      options,
    )
  }

  return {
    isPending,
    isRowPending: (rowId: TKey) => isPending && pendingRowId === rowId,
    runRowAction,
  }
}
