/**
 * File: lib/actions/safe-action.ts
 * Description: Generic wrappers for safe server actions (authenticated and public).
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
import { extractDistinctId } from '@/lib/utils/posthog'
import { handlePrismaError } from '@/lib/utils/prisma-error'
import { isRoleValue, satisfiesRole } from '@/lib/utils/role'
import type { Role } from '@/prisma/generated/prisma/enums'

/**
 * Forwards an unexpected server-action error to PostHog. Imported lazily so the
 * server-only PostHog client (and its env validation) isn't pulled into every
 * module that imports a server action, and wrapped so an analytics failure can
 * never mask the original error.
 */
const reportException = async (
  error: unknown,
  distinctId: string | undefined,
  source: string,
): Promise<void> => {
  try {
    const { captureServerException } = await import('@/lib/core/posthog')
    await captureServerException(error, distinctId, { source })
  } catch {
    // Analytics is best-effort; never let it break the action response.
  }
}

type ActionHandler<TInput, TOutput> = (
  data: TInput,
  session: AuthSession,
) => Promise<ActionState<TOutput>>

type ActionOptions<T extends z.ZodType, TOutput = unknown> = {
  schema: T
  role?: Role | Role[]
  handler: ActionHandler<z.infer<T>, TOutput>
}

type PublicActionOptions<T extends z.ZodType, TOutput = unknown> = {
  schema: T
  handler: (data: z.infer<T>) => Promise<ActionState<TOutput>>
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
    // Hoisted so the catch block can attribute exceptions to the user.
    let distinctId: string | undefined

    try {
      // 1. Authentication Check
      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session?.user) {
        return { success: false, message: 'Unauthorized' }
      }

      distinctId = session.user.id

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
      await reportException(error, distinctId, 'authenticatedAction')

      return { success: false, message: 'Internal server error' }
    }
  }
}

/**
 * Wraps a server action with input validation, structured logging, and error
 * capturing — without requiring authentication. Use for public-facing forms.
 */
export function publicAction<T extends z.ZodType, TOutput = unknown>({
  schema,
  handler,
}: PublicActionOptions<T, TOutput>) {
  return async (data: z.infer<T>): Promise<ActionState<TOutput>> => {
    try {
      // 1. Input Validation
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

      // 2. Execute Handler
      return await handler(validatedFields.data)
    } catch (error) {
      const prismaResult = handlePrismaError(error)
      if (prismaResult) {
        logger.warn({ error }, 'Prisma error in public server action')
        return prismaResult as ActionState<TOutput>
      }

      logger.error({ error }, 'Unexpected error in public server action')
      const cookieHeader = (await headers()).get('cookie') ?? undefined
      await reportException(
        error,
        extractDistinctId(cookieHeader),
        'publicAction',
      )

      return { success: false, message: 'Internal server error' }
    }
  }
}
