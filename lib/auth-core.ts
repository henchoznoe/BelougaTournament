/**
 * File: lib/auth-core.ts
 * Description: Core authentication logic (JWT) independent of Next.js runtime (headers/cookies).
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { type JWTPayload, jwtVerify, SignJWT } from 'jose'

const secretKey = process.env.JWT_SECRET_KEY
if (!secretKey) {
	throw new Error('FATAL: JWT_SECRET_KEY is not defined')
}
const key = new TextEncoder().encode(secretKey)

export enum UserRole {
	ADMIN = 'ADMIN',
	SUPERADMIN = 'SUPERADMIN',
}

export interface SessionPayload extends JWTPayload {
	user: {
		id: string
		email: string
		role: UserRole
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
