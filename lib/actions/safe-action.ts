/**
 * File: lib/actions/safe-action.ts
 * Description: Generic wrapper for safe, authenticated server actions.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

import type { z } from 'zod'
import { getSession } from '@/lib/auth'
import { ACTION_MESSAGES } from '@/lib/config/messages'
import type { ActionState } from '@/lib/types/actions'
import type { Role } from '@/prisma/generated/prisma/enums'

type ActionHandler<TInput, TOutput> = (
  data: TInput,
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
) => Promise<ActionState<TOutput>>

type ActionOptions<T extends z.ZodType> = {
  schema: T
  role?: Role | Role[]
  handler: ActionHandler<z.infer<T>, unknown>
}

/**
 * Wraps a server action with authentication, role checking, and input validation.
 */
export function authenticatedAction<T extends z.ZodType>({
  schema,
  role,
  handler,
}: ActionOptions<T>) {
  return async (data: z.infer<T>): Promise<ActionState> => {
    try {
      // 1. Authentication Check
      const session = await getSession()

      if (!session || !session.user) {
        return {
          success: false,
          message: ACTION_MESSAGES.AUTH.ERR_UNAUTHORIZED,
        }
      }

      // 2. Role Check
      if (role) {
        const allowedRoles = Array.isArray(role) ? role : [role]
        if (!allowedRoles.includes(session.user.role)) {
          return {
            success: false,
            message: ACTION_MESSAGES.AUTH.ERR_UNAUTHORIZED,
          }
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
          message: ACTION_MESSAGES.TOURNAMENTS.VALIDATION_ERROR, // Or a generic validation error
        }
      }

      // 4. Execute Handler
      return await handler(validatedFields.data, session)
    } catch (error) {
      console.error('Safe Action Error:', error)
      return {
        success: false,
        message: ACTION_MESSAGES.ADMIN.ERR_GENERIC, // Generic error fallback
      }
    }
  }
}
