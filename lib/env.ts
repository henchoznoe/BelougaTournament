/**
 * File: lib/env.ts
 * Description: Type-safe environment configuration using Zod.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

import { z } from 'zod'

const envSchema = z.object({
  // General
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // Security / JWT
  JWT_SECRET_KEY: z.string().min(1, 'JWT_SECRET_KEY is required'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),

  // Admin Seed
  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL must be a valid email'),
  ADMIN_PASSWORD: z
    .string()
    .min(6, 'ADMIN_PASSWORD must be at least 6 characters'),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  RESEND_FROM: z.string().min(1, 'RESEND_FROM is required'),

  // Storage
  BLOB_READ_WRITE_TOKEN: z.string().min(1, 'BLOB_READ_WRITE_TOKEN is required'),

  // Public
  NEXT_PUBLIC_TWITCH_PARENT: z
    .string()
    .min(1, 'NEXT_PUBLIC_TWITCH_PARENT is required'),
  NEXT_PUBLIC_DEFAULT_STREAM_URL: z
    .string()
    .min(1, 'NEXT_PUBLIC_DEFAULT_STREAM_URL must be a valid URL'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .min(1, 'NEXT_PUBLIC_APP_URL must be a valid URL')
    .optional()
    .default('http://localhost:3000'),
})

// Validate process.env
const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  console.error(
    '❌ Invalid environment variables:',
    JSON.stringify(_env.error.format(), null, 4),
  )
  throw new Error('Invalid environment variables')
}

export const env = _env.data
