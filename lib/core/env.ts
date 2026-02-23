/**
 * File: lib/core/env.ts
 * Description: Environment variables configuration
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { z } from 'zod'

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
})

const serverSchema = z.object({
  // General
  NODE_ENV: z.enum(['development', 'test', 'production']),

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

  // Monitoring
  SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Vercel runtime metadata
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
})

const isServer = typeof window === 'undefined'

// Parse client-side
const parsedClient = clientSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
})

// Parse server-side
const parsedServer = isServer
  ? serverSchema.safeParse(process.env)
  : { success: true as const, data: {} as z.infer<typeof serverSchema> }

// Centralized error handling
if (!parsedClient.success || !parsedServer.success) {
  console.error('❌ Invalid environment variables:')

  const clientErrors = parsedClient.success ? [] : parsedClient.error.issues
  const serverErrors = parsedServer.success ? [] : parsedServer.error.issues
  const allErrors = [...clientErrors, ...serverErrors]

  allErrors.forEach(issue => {
    console.error(`- ${issue.path.join('.')}: ${issue.message}`)
  })

  if (isServer && process.env.NODE_ENV !== 'test') {
    process.exit(1)
  } else if (isServer) {
    throw new Error('Invalid environment variables')
  }
}

// Export merged and typed
export const env = {
  ...parsedClient.data,
  ...(parsedServer.data as z.infer<typeof serverSchema>),
} as z.infer<typeof clientSchema> & z.infer<typeof serverSchema>
