import { z } from 'zod'

export const searchRouteQuerySchema = z.object({
  q: z.string().trim().default(''),
})

export const exportRouteQuerySchema = z.object({
  entity: z.enum(['contacts', 'companies', 'leads', 'dashboard']),
})
