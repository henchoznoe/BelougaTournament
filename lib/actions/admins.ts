/**
 * File: lib/actions/admins.ts
 * Description: Server actions for admins management.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

'use server'

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
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
// LOGIC
// ----------------------------------------------------------------------

const requireSuperAdmin = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (session?.user?.role !== Role.SUPERADMIN) {
    return null
  }
  return session
}

export const promoteUser = async (userId: string): Promise<ActionResponse> => {
  const session = await requireSuperAdmin()
  if (!session)
    return {
      success: false,
      message: fr.common.server.actions.admin.superAdminOnly,
    }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser)
      return {
        success: false,
        message: fr.common.server.actions.admin.userNotFound,
      }

    if (targetUser.role !== Role.USER) {
      return {
        success: false,
        message: 'Cet utilisateur a déjà un rôle.', // TODO: Add to messages
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: Role.ADMIN },
    })

    revalidatePath(APP_ROUTES.ADMIN_ADMINS)
    return {
      success: true,
      message: 'Utilisateur promu administrateur avec succès.',
    }
  } catch (error) {
    console.error('Promote User Error:', error)
    return {
      success: false,
      message: fr.common.server.actions.admin.genericError,
    }
  }
}

export const createAdmin = async (
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResponse> => {
  // 1. Validate Input
  const rawData = {
    email: formData.get('email'),
  }

  const validatedFields = createAdminSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      success: false,
      message: fr.common.server.actions.admin.validationError,
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // 2. Perform Action
  try {
    const { email } = validatedFields.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return {
        success: false,
        message: fr.common.server.actions.admin.emailExists,
      }
    }

    // Create user pre-provisioned for OAuth
    await prisma.user.create({
      data: {
        email,
        name: 'Admin (Pending)', // Placeholder name
        role: Role.ADMIN, // Explicitly create as ADMIN as this is an intentional admin action
        emailVerified: true, // Trust admin created emails
      },
    })

    revalidatePath(APP_ROUTES.ADMIN_SETTINGS)
    return {
      success: true,
      message: fr.common.server.actions.admin.successCreate,
    }
  } catch (error) {
    console.error('Create Admin Error:', error)
    return {
      success: false,
      message: fr.common.server.actions.admin.genericError,
    }
  }
}

// ... rest of the file ...

export const updateAdmin = async (
  userId: string,
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResponse> => {
  // 1. Auth Check
  const session = await requireSuperAdmin()
  if (!session)
    return {
      success: false,
      message: fr.common.server.actions.admin.superAdminOnly,
    }

  // 2. Validate Input
  const rawData = {
    email: formData.get('email'),
    role: formData.get('role'),
  }

  const validatedFields = updateAdminSchema.safeParse(rawData)
  if (!validatedFields.success) {
    return {
      success: false,
      message: fr.common.server.actions.admin.validationError,
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser)
      return {
        success: false,
        message: fr.common.server.actions.admin.userNotFound,
      }

    // 3. Permission Logic: Protect other SuperAdmins
    // Allow editing self, but prevent editing other SuperAdmins
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
    console.error('Update Admin Error:', error)
    return {
      success: false,
      message: fr.common.server.actions.admin.genericError,
    }
  }
}

export const deleteAdmin = async (userId: string): Promise<ActionResponse> => {
  const session = await requireSuperAdmin()
  if (!session)
    return {
      success: false,
      message: fr.common.server.actions.admin.superAdminOnly,
    }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser)
      return {
        success: false,
        message: fr.common.server.actions.admin.userNotFound,
      }

    // Rule: Cannot delete a SuperAdmin (even self, usually prevents lockout)
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
    console.error('Delete Admin Error:', error)
    return {
      success: false,
      message: fr.common.server.actions.admin.genericError,
    }
  }
}
