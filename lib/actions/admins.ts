/**
 * File: lib/actions/admins.ts
 * Description: Server actions for admin management with strict SuperAdmin authorization.
 * Author: Noé Henchoz
 * Date: 2025-12-10
 * License: MIT
 */

'use server'

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import type { z } from 'zod'
import auth from '@/lib/auth'
import { APP_ROUTES } from '@/lib/config/routes'
import prisma from '@/lib/db/prisma'
import { fr } from '@/lib/i18n/dictionaries/fr'
import { createAdminSchema, updateAdminSchema } from '@/lib/validations/admin'
import { Role } from '@/prisma/generated/prisma/enums'

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

type ActionResponse = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

// TODO: Move to i18n
const MESSAGES = {
  USER_ALREADY_HAS_ROLE: 'Cet utilisateur a déjà un rôle.',
  USER_PROMOTED: 'Utilisateur promu administrateur avec succès.',
  ADMIN_PENDING_NAME: 'Admin (Pending)',
}

// ----------------------------------------------------------------------
// INTERNAL HELPERS
// ----------------------------------------------------------------------

/**
 * Ensures the current user is a SuperAdmin.
 * Throws an error if not authorized to interrupt the flow cleanly.
 */
async function assertSuperAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session?.user?.role !== Role.SUPERADMIN) {
    throw new Error('UNAUTHORIZED_SUPERADMIN')
  }
  return session
}

/**
 * Maps Zod issues to a field-error record.
 */
function mapValidationErrors(issues: z.ZodIssue[]): Record<string, string[]> {
  const errors: Record<string, string[]> = {}
  issues.forEach(issue => {
    const path = issue.path[0]?.toString() || 'global'
    if (!errors[path]) {
      errors[path] = []
    }
    errors[path].push(issue.message)
  })
  return errors
}

/**
 * Wrapper to handle errors uniformly.
 */
function handleActionError(error: unknown): ActionResponse {
  if (error instanceof Error && error.message === 'UNAUTHORIZED_SUPERADMIN') {
    return {
      success: false,
      message: fr.common.server.actions.admin.superAdminOnly,
    }
  }

  console.error('Admin Action Error:', error)
  return {
    success: false,
    message: fr.common.server.actions.admin.genericError,
  }
}

// ----------------------------------------------------------------------
// PUBLIC ACTIONS
// ----------------------------------------------------------------------

export const promoteUser = async (userId: string): Promise<ActionResponse> => {
  try {
    await assertSuperAdmin()

    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return {
        success: false,
        message: fr.common.server.actions.admin.userNotFound,
      }
    }

    if (targetUser.role !== Role.USER) {
      return {
        success: false,
        message: MESSAGES.USER_ALREADY_HAS_ROLE,
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: Role.ADMIN },
    })

    revalidatePath(APP_ROUTES.ADMIN_ADMINS)
    return {
      success: true,
      message: MESSAGES.USER_PROMOTED,
    }
  } catch (error) {
    return handleActionError(error)
  }
}

export const createAdmin = async (
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResponse> => {
  try {
    await assertSuperAdmin()

    // Validate Input
    const rawData = {
      email: formData.get('email'),
    }

    const validatedFields = createAdminSchema.safeParse(rawData)

    if (!validatedFields.success) {
      return {
        success: false,
        message: fr.common.server.actions.admin.validationError,
        errors: mapValidationErrors(validatedFields.error.issues),
      }
    }

    // Business Logic
    const { email } = validatedFields.data

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return {
        success: false,
        message: fr.common.server.actions.admin.emailExists,
      }
    }

    await prisma.user.create({
      data: {
        email,
        name: MESSAGES.ADMIN_PENDING_NAME,
        role: Role.ADMIN,
        emailVerified: true,
      },
    })

    revalidatePath(APP_ROUTES.ADMIN_SETTINGS)
    return {
      success: true,
      message: fr.common.server.actions.admin.successCreate,
    }
  } catch (error) {
    return handleActionError(error)
  }
}

export const updateAdmin = async (
  userId: string,
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResponse> => {
  try {
    const session = await assertSuperAdmin()

    // Validate Input
    const rawData = {
      email: formData.get('email'),
      role: formData.get('role'),
    }

    const validatedFields = updateAdminSchema.safeParse(rawData)
    if (!validatedFields.success) {
      return {
        success: false,
        message: fr.common.server.actions.admin.validationError,
        errors: mapValidationErrors(validatedFields.error.issues),
      }
    }

    // Check Target
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return {
        success: false,
        message: fr.common.server.actions.admin.userNotFound,
      }
    }

    // Protect SuperAdmins
    if (targetUser.role === Role.SUPERADMIN && session.user.id !== userId) {
      return {
        success: false,
        message: fr.common.server.actions.admin.protectedSuperAdmin,
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: validatedFields.data,
    })

    revalidatePath(APP_ROUTES.ADMIN_ADMINS)
    return {
      success: true,
      message: fr.common.server.actions.admin.successUpdate,
    }
  } catch (error) {
    return handleActionError(error)
  }
}

export const deleteAdmin = async (userId: string): Promise<ActionResponse> => {
  try {
    await assertSuperAdmin()

    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return {
        success: false,
        message: fr.common.server.actions.admin.userNotFound,
      }
    }

    if (targetUser.role === Role.SUPERADMIN) {
      return {
        success: false,
        message: fr.common.server.actions.admin.protectedSuperAdmin,
      }
    }

    await prisma.user.delete({ where: { id: userId } })

    revalidatePath(APP_ROUTES.ADMIN_ADMINS)
    return {
      success: true,
      message: fr.common.server.actions.admin.successDelete,
    }
  } catch (error) {
    return handleActionError(error)
  }
}
