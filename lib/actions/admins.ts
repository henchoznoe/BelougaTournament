/**
 * File: lib/actions/admins.ts
 * Description: Server actions for admins management.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

'use server'

import { hash } from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { UserRole } from '@/lib/auth'
import prisma from '@/lib/prisma'

const createAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function createAdmin(_prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const validatedFields = createAdminSchema.safeParse({ email, password })

  if (!validatedFields.success) {
    return {
      message: 'Invalid fields',
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const hashedPassword = await hash(password, 12)

    await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: 'ADMIN',
      },
    })

    revalidatePath('/admin/settings')
    return { message: 'Admin created successfully' }
  } catch (_error) {
    return { message: 'Failed to create admin. Email might already exist.' }
  }
}

export async function updateAdmin(
  userId: string,
  _prevState: unknown,
  formData: FormData,
) {
  const session = await import('@/lib/auth').then(m => m.getSession())
  if (!session?.user) return { message: 'Unauthorized' }

  const email = formData.get('email') as string
  const role = formData.get('role') as string

  // Validation
  if (!email || !role) {
    return { message: 'Email and Role are required' }
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) return { message: 'User not found' }

    // Permission Logic
    const isSuperAdmin = session.user.role === 'SUPERADMIN'

    // Rule: Only SuperAdmins can update admins
    if (!isSuperAdmin) {
      return {
        message: 'Unauthorized: Only SuperAdmins can update users',
      }
    }

    // Rule: Cannot modify another SuperAdmin (unless it is myself)
    // Actually, let's keep it simple: SuperAdmins can edit anyone, including themselves.
    // But if we want to prevent accidental lockout/demotion of other superadmins:
    if (targetUser.role === 'SUPERADMIN' && session.user.id !== userId) {
      return { message: 'Cannot modify another SuperAdmin' }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { email, role: role as UserRole },
    })

    revalidatePath('/admin/users')
    return { message: 'Admin updated successfully' }
  } catch (_error) {
    return { message: 'Failed to update admin' }
  }
}

export async function deleteAdmin(userId: string) {
  const session = await import('@/lib/auth').then(m => m.getSession())
  if (!session?.user) return { message: 'Unauthorized' }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) return { message: 'User not found' }

    // Rule: Cannot delete a SuperAdmin
    if (targetUser.role === 'SUPERADMIN') {
      return { message: 'Cannot delete a SuperAdmin' }
    }

    // Rule: Only SuperAdmins can delete users
    if (session.user.role !== 'SUPERADMIN') {
      return { message: 'Unauthorized to delete users' }
    }

    await prisma.user.delete({
      where: { id: userId },
    })
    revalidatePath('/admin/users')
    return { message: 'Admin deleted successfully' }
  } catch (_error) {
    return { message: 'Failed to delete admin' }
  }
}

export async function resetAdminPassword(
  targetUserId: string,
  newPassword: string,
) {
  const session = await import('@/lib/auth').then(m => m.getSession())

  if (!session || !session.user || session.user.role !== 'SUPERADMIN') {
    throw new Error('Unauthorized: Only SuperAdmins can reset passwords')
  }

  try {
    const hashedPassword = await hash(newPassword, 12)

    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        passwordHash: hashedPassword,
      },
    })

    revalidatePath('/admin/settings')
    return { message: 'Password reset successfully' }
  } catch (error) {
    console.error('Password Reset Error:', error)
    throw new Error('Failed to reset password')
  }
}
