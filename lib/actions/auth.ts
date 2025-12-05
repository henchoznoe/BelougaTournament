/**
 * File: lib/actions/auth.ts
 * Description: Server actions for user authentication (login, logout).
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

'use server'

import { compare, hash } from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { encrypt, getSession, UserRole } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function login(_prevState: unknown, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { message: "L'email et le mot de passe sont requis.", email }
    }

    const user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user || !(await compare(password, user.passwordHash))) {
        return { message: 'Identifiants invalides.', email }
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERADMIN) {
        return { message: 'Accès non autorisé.', email }
    }

    // Create session
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    const session = await encrypt({
        user: { id: user.id, email: user.email, role: user.role as UserRole },
        expires,
    })

    ;(await cookies()).set('session', session, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    })

    redirect('/admin')
}

export async function logout() {
    ;(await cookies()).delete('session')
    redirect('/')
}

export async function registerAdmin(formData: FormData) {
    const session = await getSession()
    if (session?.user?.role !== UserRole.SUPERADMIN) {
        throw new Error('Unauthorized')
    }

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        throw new Error('Email and password are required')
    }

    const passwordHash = await hash(password, 10)

    await prisma.user.create({
        data: {
            email,
            passwordHash,
            role: UserRole.ADMIN,
        },
    })
}
