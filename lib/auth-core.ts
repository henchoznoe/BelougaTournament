/**
 * File: lib/auth-core.ts
 * Description: Core authentication logic (JWT) independent of Next.js runtime (headers/cookies).
 * Author: Noé Henchoz
 * Date: 2025-12-05
 * License: MIT
 */

import { type JWTPayload, jwtVerify, SignJWT } from 'jose'
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
const ENV_KEYS = {
  JWT_SECRET: 'JWT_SECRET_KEY',
} as const

const JWT_CONFIG = {
  ALG: 'HS256',
  EXPIRATION: '24h',
} as const

const ERRORS = {
  MISSING_SECRET: `Environment variable ${ENV_KEYS.JWT_SECRET} is not defined.`,
  INVALID_TOKEN: 'Invalid or expired session token.',
} as const

// Get encoded key from environment variable
const getEncodedKey = (): Uint8Array => {
  const secret = process.env[ENV_KEYS.JWT_SECRET]

  if (!secret) {
    throw new Error(ERRORS.MISSING_SECRET)
  }

  return new TextEncoder().encode(secret)
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
