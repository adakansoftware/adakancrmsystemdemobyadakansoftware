'use server'

import { db } from '@/lib/db/prisma'
import { createValidatedAction } from '@/lib/actions/create-validated-action'

export { db, createValidatedAction }
