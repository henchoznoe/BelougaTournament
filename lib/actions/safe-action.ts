/**
 * File: lib/actions/safe-action.ts
 * Description: Generic wrapper for safe, authenticated server actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { headers } from 'next/headers'
import type { z } from 'zod'
import auth from '@/lib/core/auth'
import { logger } from '@/lib/core/logger'
import type { ActionState } from '@/lib/types/actions'
import type { AuthSession } from '@/lib/types/auth'
import { handlePrismaError } from '@/lib/utils/prisma-error'
import type { Role } from '@/prisma/generated/prisma/enums'

type ActionHandler<TInput, TOutput> = (
  data: TInput,
  session: AuthSession,
) => Promise<ActionState<TOutput>>

type ActionOptions<T extends z.ZodType> = {
  schema: T
  role?: Role | Role[]
  handler: ActionHandler<z.infer<T>, unknown>
}

/**
 * Wraps a server action with authentication, role checking, input validation,
 * structured logging, and error capturing.
 */
export function authenticatedAction<T extends z.ZodType>({
  schema,
  role,
  handler,
}: ActionOptions<T>) {
  return async (data: z.infer<T>): Promise<ActionState> => {
    try {
      // 1. Authentication Check
      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session || !session.user) {
        return { success: false, message: 'Unauthorized' }
      }

      // 2. Role Check
      if (role) {
        const allowedRoles = Array.isArray(role) ? role : [role]
        // BetterAuth types role as string; cast to Role for enum comparison
        if (!allowedRoles.includes(session.user.role as Role)) {
          return { success: false, message: 'Unauthorized' }
        }
      }

      // 3. Input Validation
      const validatedFields = schema.safeParse(data)

      if (!validatedFields.success) {
        return {
          success: false,
          errors: validatedFields.error.flatten().fieldErrors as Record<
            string,
            string[]
          >,
          message: 'Validation error',
        }
      }

      // 4. Execute Handler
      return await handler(validatedFields.data, session as AuthSession)
    } catch (error) {
      const prismaResult = handlePrismaError(error)
      if (prismaResult) {
        logger.warn({ error }, 'Prisma error in server action')
        return prismaResult
      }

      logger.error({ error }, 'Unexpected error in server action')

      return { success: false, message: 'Internal server error' }
    }
  }
}
