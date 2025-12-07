/**
 * File: lib/auth-core.ts
 * Description: Core authentication logic (JWT) independent of Next.js runtime (headers/cookies).
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { type JWTPayload, jwtVerify, SignJWT } from 'jose'
import { env } from '@/lib/env'
import type { Role } from '@/prisma/generated/prisma/enums'

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

export interface SessionPayload extends JWTPayload {
  user: {
    id: string
    email: string
    role: Role
  }
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const JWT_CONFIG = {
  ALG: 'HS256',
  EXPIRATION: '24h',
} as const

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

const getEncodedKey = (): Uint8Array => {
  return new TextEncoder().encode(env.JWT_SECRET_KEY)
}

export const encrypt = async (payload: SessionPayload): Promise<string> => {
  const key = getEncodedKey()

  return new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_CONFIG.ALG })
    .setIssuedAt()
    .setExpirationTime(JWT_CONFIG.EXPIRATION)
    .sign(key)
}

export const decrypt = async (input: string): Promise<SessionPayload> => {
  const key = getEncodedKey()

  const { payload } = await jwtVerify(input, key, {
    algorithms: [JWT_CONFIG.ALG],
  })

  return payload as SessionPayload
}
