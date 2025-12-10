/**
 * File: lib/env.ts
 * Description: Type-safe environment configuration using Zod.
 * Author: Noé Henchoz
 * Date: 2025-12-09
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { z } from 'zod'

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const envSchema = z.object({
  // General
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
  BETTER_AUTH_URL: z.url('BETTER_AUTH_URL is required'),

  // OAuth Providers
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID is required'),
  DISCORD_CLIENT_SECRET: z.string().min(1, 'DISCORD_CLIENT_SECRET is required'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  RESEND_FROM: z.string().min(1, 'RESEND_FROM is required'),

  // Storage
  BLOB_READ_WRITE_TOKEN: z.string().min(1, 'BLOB_READ_WRITE_TOKEN is required'),

  // Public
  NEXT_PUBLIC_APP_URL: z.url('NEXT_PUBLIC_APP_URL is required'),
})

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  console.error('❌ Invalid environment variables:')
  for (const issue of _env.error.issues) {
    console.error(`${issue.path.join('.')}: ${issue.message}`)
  }

  if (typeof process !== 'undefined' && typeof process.exit === 'function') {
    process.exit(1)
  } else {
    throw new Error('Invalid environment variables')
  }
}

export const env = _env.data
