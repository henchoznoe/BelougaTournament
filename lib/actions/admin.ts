/**
 * File: lib/actions/admin.ts
 * Description: Server actions for admin management with strict SuperAdmin authorization.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { APP_ROUTES } from '@/lib/config/routes'
import auth from '@/lib/core/auth'
import * as UserService from '@/lib/services/user.service'
import { createAdminSchema, updateAdminSchema } from '@/lib/validations/admin'
import { Role } from '@/prisma/generated/prisma/enums'

type ActionResponse = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

const MESSAGES = {
  USER_ALREADY_HAS_ROLE: 'Cet utilisateur a déjà un rôle.',
  USER_PROMOTED: 'Utilisateur promu administrateur avec succès.',
  ADMIN_PENDING_NAME: 'Admin (Pending)',
}

async function assertSuperAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session?.user?.role !== Role.SUPERADMIN) {
    throw new Error('UNAUTHORIZED_SUPERADMIN')
  }
  return session
}

function handleActionError(error: unknown): ActionResponse {
  if (error instanceof Error && error.message === 'UNAUTHORIZED_SUPERADMIN') {
    return {
      success: false,
      message: 'Vous devez être SuperAdmin pour effectuer cette action.',
    }
  }

  console.error('Admin Action Error:', error)
  return {
    success: false,
    message: 'Une erreur est survenue.',
  }
}

export const promoteUser = async (userId: string): Promise<ActionResponse> => {
  try {
    await assertSuperAdmin()

    const targetUser = await UserService.getUserById(userId)
    if (!targetUser) {
      return {
        success: false,
        message: 'Utilisateur non trouvé.',
      }
    }

    if (targetUser.role !== Role.USER) {
      return {
        success: false,
        message: MESSAGES.USER_ALREADY_HAS_ROLE,
      }
    }

    await UserService.updateUserRole(userId, Role.ADMIN)

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

    const rawData = {
      email: formData.get('email'),
    }

    const validatedFields = createAdminSchema.safeParse(rawData)

    if (!validatedFields.success) {
      return {
        success: false,
        message: 'Erreur de validation.',
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { email } = validatedFields.data

    const existingUser = await UserService.getUserByEmail(email)
    if (existingUser) {
      return {
        success: false,
        message: 'Email déjà existant.',
      }
    }

    await UserService.createAdminUser(email, MESSAGES.ADMIN_PENDING_NAME)

    revalidatePath(APP_ROUTES.ADMIN_SETTINGS)
    return {
      success: true,
      message: 'Admin créé avec succès.',
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

    const rawData = {
      email: formData.get('email'),
      role: formData.get('role'),
    }

    const validatedFields = updateAdminSchema.safeParse(rawData)
    if (!validatedFields.success) {
      return {
        success: false,
        message: 'Erreur de validation.',
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const targetUser = await UserService.getUserById(userId)
    if (!targetUser) {
      return {
        success: false,
        message: 'Utilisateur non trouvé.',
      }
    }

    if (targetUser.role === Role.SUPERADMIN && session.user.id !== userId) {
      return {
        success: false,
        message: 'Vous ne pouvez pas modifier un SuperAdmin.',
      }
    }

    await UserService.updateUser(userId, validatedFields.data)

    revalidatePath(APP_ROUTES.ADMIN_ADMINS)
    return {
      success: true,
      message: 'Admin modifié avec succès.',
    }
  } catch (error) {
    return handleActionError(error)
  }
}

export const deleteAdmin = async (userId: string): Promise<ActionResponse> => {
  try {
    await assertSuperAdmin()

    const targetUser = await UserService.getUserById(userId)
    if (!targetUser) {
      return {
        success: false,
        message: 'Utilisateur non trouvé.',
      }
    }

    if (targetUser.role === Role.SUPERADMIN) {
      return {
        success: false,
        message: 'Vous ne pouvez pas supprimer un SuperAdmin.',
      }
    }

    await UserService.deleteUser(userId)

    revalidatePath(APP_ROUTES.ADMIN_ADMINS)
    return {
      success: true,
      message: 'Admin supprimé avec succès.',
    }
  } catch (error) {
    return handleActionError(error)
  }
}
