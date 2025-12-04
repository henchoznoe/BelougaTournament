/**
 * File: lib/actions/users.ts
 * Description: Server actions for user management.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

'use server'

import { hash } from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const createUserSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function createAdmin(_prevState: unknown, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const validatedFields = createUserSchema.safeParse({ email, password })

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

export async function deleteAdmin(userId: string) {
    try {
        await prisma.user.delete({
            where: { id: userId },
        })
        revalidatePath('/admin/settings')
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
