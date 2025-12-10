/**
 * File: lib/actions/safe-action.ts
 * Description: Generic wrapper for safe, authenticated server actions.
 * Author: Noé Henchoz
 * Date: 2025-12-08
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { headers } from 'next/headers'
import type { z } from 'zod'
import auth from '@/lib/core/auth'
import { fr } from '@/lib/i18n/dictionaries/fr'
import type { ActionState } from '@/lib/types/actions'
import type { Role } from '@/prisma/generated/prisma/enums'

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

// Update ActionHandler to reflect Better-Auth session structure
type ActionHandler<TInput, TOutput> = (
  data: TInput,
  session: {
    user: { role: Role; [key: string]: unknown }
    session: Record<string, unknown>
  },
) => Promise<ActionState<TOutput>>

type ActionOptions<T extends z.ZodType> = {
  schema: T
  role?: Role | Role[]
  handler: ActionHandler<z.infer<T>, unknown>
}

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

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
      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session || !session.user) {
        return {
          success: false,
          message: fr.common.server.actions.auth.unauthorized,
        }
      }

      // 2. Role Check
      if (role) {
        const allowedRoles = Array.isArray(role) ? role : [role]
        // Cast role to Role enum to satisfy TypeScript if needed,
        // assuming database role matches enum
        if (!allowedRoles.includes(session.user.role as Role)) {
          return {
            success: false,
            message: fr.common.server.actions.auth.unauthorized,
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
          message: fr.common.server.actions.auth.validation,
        }
      }

      // 4. Execute Handler
      // biome-ignore lint/suspicious/noExplicitAny: Casting to match ActionHandler type
      return await handler(validatedFields.data, session as any)
    } catch (error) {
      console.error('Safe Action Error:', error)
      return {
        success: false,
        message: fr.common.errors.generic,
      }
    }
  }
}
