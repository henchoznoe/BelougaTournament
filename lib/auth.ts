/**
 * File: lib/auth.ts
 * Description: JWT encryption and decryption helpers for session management.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { type JWTPayload, jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'

const secretKey = process.env.JWT_SECRET_KEY
if (!secretKey) {
	throw new Error('FATAL: JWT_SECRET_KEY is not defined')
}
const key = new TextEncoder().encode(secretKey)

export interface SessionPayload extends JWTPayload {
	user: {
		id: string
		email: string
		role: string
	}
}

export async function encrypt(payload: SessionPayload) {
	return await new SignJWT(payload)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('24h')
		.sign(key)
}

export async function decrypt(input: string): Promise<SessionPayload> {
	const { payload } = await jwtVerify(input, key, {
		algorithms: ['HS256'],
	})
	return payload as SessionPayload
}

export async function getSession() {
	const session = (await cookies()).get('session')?.value
	if (!session) return null
	try {
		return await decrypt(session)
	} catch (_error) {
		return null
	}
}
