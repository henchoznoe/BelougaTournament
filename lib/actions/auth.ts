/**
 * File: lib/actions/auth.ts
 * Description: Server actions for user authentication (login, logout).
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

'use server'

import { compare } from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { encrypt, UserRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function login(_prevState: unknown, formData: FormData) {
	const email = formData.get('email') as string
	const password = formData.get('password') as string

	if (!email || !password) {
		return { message: 'Email and password are required.' }
	}

	const user = await prisma.user.findUnique({
		where: { email },
	})

	if (!user || !(await compare(password, user.passwordHash))) {
		return { message: 'Invalid credentials.' }
	}

	if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPERADMIN) {
		return { message: 'Unauthorized access.' }
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
	redirect('/login')
}
