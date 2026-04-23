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
import { isRoleValue } from '@/lib/utils/role'
import { Role } from '@/prisma/generated/prisma/enums'

type ActionHandler<TInput, TOutput> = (
  data: TInput,
  session: AuthSession,
) => Promise<ActionState<TOutput>>

type ActionOptions<T extends z.ZodType, TOutput = unknown> = {
  schema: T
  role?: Role | Role[]
  handler: ActionHandler<z.infer<T>, TOutput>
}

/** Returns true if `userRole` satisfies `requiredRole` considering the role hierarchy. */
const satisfiesRole = (userRole: Role, requiredRole: Role): boolean => {
  if (userRole === requiredRole) return true
  if (userRole === Role.SUPER_ADMIN && requiredRole === Role.ADMIN) return true
  return false
}

/**
 * Wraps a server action with authentication, role checking, input validation,
 * structured logging, and error capturing.
 */
export function authenticatedAction<T extends z.ZodType, TOutput = unknown>({
  schema,
  role,
  handler,
}: ActionOptions<T, TOutput>) {
  return async (data: z.infer<T>): Promise<ActionState<TOutput>> => {
    try {
      // 1. Authentication Check
      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session?.user) {
        return { success: false, message: 'Unauthorized' }
      }

      // 2. Role Check
      if (role) {
        const allowedRoles = Array.isArray(role) ? role : [role]
        // BetterAuth types role as string | null | undefined; we guard against
        // all three non-string cases and unknown enum values before inclusion check.
        const userRole = session.user.role
        if (
          typeof userRole !== 'string' ||
          !isRoleValue(userRole) ||
          !allowedRoles.some(r => satisfiesRole(userRole, r))
        ) {
          return { success: false, message: 'Unauthorized' }
        }
      }

      // 3. Input Validation
      const validatedFields = schema.safeParse(data)

      if (!validatedFields.success) {
        return {
          success: false,
          // Zod's flatten().fieldErrors is typed as Partial<Record<string, string[]>>;
          // cast to non-partial Record since we only use it for display, not exhaustive access
          errors: validatedFields.error.flatten().fieldErrors as Record<
            string,
            string[]
          >,
          message: 'Validation error',
        }
      }

      // 4. Execute Handler
      // BetterAuth returns a generic session shape; cast to our typed AuthSession
      return await handler(validatedFields.data, session as AuthSession)
    } catch (error) {
      const prismaResult = handlePrismaError(error)
      if (prismaResult) {
        logger.warn({ error }, 'Prisma error in server action')
        // handlePrismaError returns ActionState without the TOutput generic; safe to cast
        return prismaResult as ActionState<TOutput>
      }

      logger.error({ error }, 'Unexpected error in server action')

      return { success: false, message: 'Internal server error' }
    }
  }
}
