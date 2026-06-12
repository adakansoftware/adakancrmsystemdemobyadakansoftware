import { z } from 'zod'

type ValidatedActionResult<TData> =
  | { success: true; data: TData }
  | { success: false; errors: Partial<Record<string, string[]>> }

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
