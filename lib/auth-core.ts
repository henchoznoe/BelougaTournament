/**
 * File: lib/auth-core.ts
 * Description: Core authentication logic (JWT) independent of Next.js runtime (headers/cookies).
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

import { type JWTPayload, jwtVerify, SignJWT } from 'jose'
import { env } from '@/lib/env'
import type { Role } from '@/prisma/generated/prisma/enums'

// Types

export interface SessionPayload extends JWTPayload {
  user: {
    id: string
    email: string
    role: Role
  }
}

// Constants
const JWT_CONFIG = {
  ALG: 'HS256',
  EXPIRATION: '24h',
} as const

// Get encoded key from environment variable
const getEncodedKey = (): Uint8Array => {
  return new TextEncoder().encode(env.JWT_SECRET_KEY)
}

// Encrypt token
export const encrypt = async (payload: SessionPayload): Promise<string> => {
  const key = getEncodedKey()

  return new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_CONFIG.ALG })
    .setIssuedAt()
    .setExpirationTime(JWT_CONFIG.EXPIRATION)
    .sign(key)
}

// Decrypt token
export async function decrypt(input: string): Promise<SessionPayload> {
  const key = getEncodedKey()

  const { payload } = await jwtVerify(input, key, {
    algorithms: [JWT_CONFIG.ALG],
  })

  return payload as SessionPayload
}
