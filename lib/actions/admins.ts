/**
 * File: lib/actions/admins.ts
 * Description: Server actions for admins management.
 * Author: Noé Henchoz
 * Date: 2025-12-06
 * License: MIT
 */

'use server'

import { hash } from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/db/prisma'
import { Role } from '@/prisma/generated/prisma/enums'

// Types
type ActionResponse = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

import { ACTION_MESSAGES } from '@/lib/config/messages'
import { APP_ROUTES } from '@/lib/config/routes'

// Constants
const SECURITY_CONFIG = {
  SALT_ROUNDS: 12,
  MIN_PASSWORD_LENGTH: 8,
} as const

// Schemas
const createAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(SECURITY_CONFIG.MIN_PASSWORD_LENGTH, 'Password is too short'),
})

const updateAdminSchema = z.object({
  email: z.string().email(),
  role: z.enum(Role),
})

const requireSuperAdmin = async () => {
  const session = await getSession()
  if (session?.user?.role !== Role.SUPERADMIN) {
    return null
  }
  return session
}

export const createAdmin = async (
  _prevState: unknown,
  formData: FormData,
): Promise<ActionResponse> => {
  // 1. Validate Input
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const validatedFields = createAdminSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      success: false,
      message: ACTION_MESSAGES.ADMIN.ERR_VALIDATION,
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // 2. Perform Action
  try {
    const { email, password } = validatedFields.data
    const hashedPassword = await hash(password, SECURITY_CONFIG.SALT_ROUNDS)

    await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: Role.ADMIN,
      },
    })

    revalidatePath(APP_ROUTES.ADMIN_SETTINGS)
    return { success: true, message: ACTION_MESSAGES.ADMIN.SUCCESS_CREATE }
  } catch (error) {
    console.error('Create Admin Error:', error)
    return { success: false, message: ACTION_MESSAGES.ADMIN.ERR_EMAIL_EXISTS }
  }
}

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
      message: ACTION_MESSAGES.ADMIN.ERR_SUPERADMIN_ONLY,
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
      message: ACTION_MESSAGES.ADMIN.ERR_VALIDATION,
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser)
      return {
        success: false,
        message: ACTION_MESSAGES.ADMIN.ERR_USER_NOT_FOUND,
      }

    // 3. Permission Logic: Protect other SuperAdmins
    // Allow editing self, but prevent editing other SuperAdmins
    if (targetUser.role === Role.SUPERADMIN && session.user.id !== userId) {
      return {
        success: false,
        message: ACTION_MESSAGES.ADMIN.ERR_PROTECTED_SUPERADMIN,
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: validatedFields.data,
    })

    revalidatePath(APP_ROUTES.ADMIN_ADMINS)
    return { success: true, message: ACTION_MESSAGES.ADMIN.SUCCESS_UPDATE }
  } catch (error) {
    console.error('Update Admin Error:', error)
    return { success: false, message: ACTION_MESSAGES.ADMIN.ERR_GENERIC }
  }
}

export const deleteAdmin = async (userId: string): Promise<ActionResponse> => {
  const session = await requireSuperAdmin()
  if (!session)
    return {
      success: false,
      message: ACTION_MESSAGES.ADMIN.ERR_SUPERADMIN_ONLY,
    }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser)
      return {
        success: false,
        message: ACTION_MESSAGES.ADMIN.ERR_USER_NOT_FOUND,
      }

    // Rule: Cannot delete a SuperAdmin (even self, usually prevents lockout)
    if (targetUser.role === Role.SUPERADMIN) {
      return {
        success: false,
        message: ACTION_MESSAGES.ADMIN.ERR_PROTECTED_SUPERADMIN,
      }
    }

    await prisma.user.delete({ where: { id: userId } })

    revalidatePath(APP_ROUTES.ADMIN_ADMINS)
    return { success: true, message: ACTION_MESSAGES.ADMIN.SUCCESS_DELETE }
  } catch (error) {
    console.error('Delete Admin Error:', error)
    return { success: false, message: ACTION_MESSAGES.ADMIN.ERR_GENERIC }
  }
}

export const resetAdminPassword = async (
  targetUserId: string,
  newPassword: string,
): Promise<ActionResponse> => {
  const session = await requireSuperAdmin()
  if (!session)
    return {
      success: false,
      message: ACTION_MESSAGES.ADMIN.ERR_SUPERADMIN_ONLY,
    }

  try {
    // Validate simple constraints on the new password manually since it's an arg, not FormData
    if (newPassword.length < SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
      return { success: false, message: 'Password is too short.' }
    }

    const hashedPassword = await hash(newPassword, SECURITY_CONFIG.SALT_ROUNDS)

    await prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash: hashedPassword },
    })

    revalidatePath(APP_ROUTES.ADMIN_SETTINGS)
    return { success: true, message: ACTION_MESSAGES.ADMIN.SUCCESS_RESET }
  } catch (error) {
    console.error('Password Reset Error:', error)
    return { success: false, message: ACTION_MESSAGES.ADMIN.ERR_GENERIC }
  }
}
