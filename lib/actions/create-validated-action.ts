import { z } from 'zod'

export type ValidatedActionErrors = Partial<Record<string, string[]>>

export type ValidatedActionResult<TData> =
  | { success: true; data: TData }
  | { success: false; errors: ValidatedActionErrors }

export function getFirstValidationError(errors: ValidatedActionErrors) {
  return Object.values(errors).flat().find((message) => typeof message === 'string')
}

export function createValidatedAction<TSchema extends z.ZodType, TResult>(
  schema: TSchema,
  handler: (input: z.infer<TSchema>) => Promise<TResult>,
) {
  return async function execute(
    input: z.input<TSchema>,
  ): Promise<ValidatedActionResult<TResult>> {
    const parsed = schema.safeParse(input)

    if (!parsed.success) {
      return {
        success: false,
        errors: z.flattenError(parsed.error).fieldErrors,
      }
    }

    const data = await handler(parsed.data)

    return {
      success: true,
      data,
    }
  }
}
