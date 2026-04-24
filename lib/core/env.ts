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
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required')
    .optional(),
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: z
    .string()
    .min(1, 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is required')
    .optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z
    .url('NEXT_PUBLIC_POSTHOG_HOST must be a valid URL')
    .optional(),
})

const serverSchema = z.object({
  // General
  NODE_ENV: z.enum(['development', 'test', 'production']),

  // Better Auth
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.url('BETTER_AUTH_URL is required'),

  // OAuth Providers
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID is required'),
  DISCORD_CLIENT_SECRET: z.string().min(1, 'DISCORD_CLIENT_SECRET is required'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),

  // Storage
  BLOB_READ_WRITE_TOKEN: z.string().min(1, 'BLOB_READ_WRITE_TOKEN is required'),

  // Stripe
  STRIPE_SECRET_KEY: z
    .string()
    .min(1, 'STRIPE_SECRET_KEY is required')
    .optional(),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, 'STRIPE_WEBHOOK_SECRET is required')
    .optional(),

  // Vercel runtime metadata
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
})

const isServer = typeof window === 'undefined'

// Parse client-side
const parsedClient = clientSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN:
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
})

// Parse server-side
const parsedServer = isServer
  ? serverSchema.safeParse(process.env)
  : { success: true as const, data: {} as z.infer<typeof serverSchema> }

// Centralized error handling. Never log raw values — only variable names and validation messages.
if (!parsedClient.success || !parsedServer.success) {
  const clientErrors = parsedClient.success ? [] : parsedClient.error.issues
  const serverErrors = parsedServer.success ? [] : parsedServer.error.issues
  const allErrors = [...clientErrors, ...serverErrors]
  const summary = allErrors
    .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n')

  // `logger` cannot be used here: it imports `env`, which is this module, creating
  // a circular dependency at module initialisation time. `console.error` is the
  // only safe option at this point in the startup sequence.
  console.error(`Invalid environment configuration:\n${summary}`)

  // Use the raw process.env.NODE_ENV here because `parsedServer.data` may not be
  // available (validation just failed). On the client, `isServer` is false so we
  // throw instead of calling process.exit (which is Node-only).
  if (isServer && process.env.NODE_ENV !== 'test') {
    process.exit(1)
  } else if (isServer) {
    throw new Error('Invalid environment variables')
  }
}

// Named intersection type for the merged environment object
type Env = z.infer<typeof clientSchema> & z.infer<typeof serverSchema>

// Export merged and typed
export const env = {
  ...parsedClient.data,
  // parsedServer.data is `{}` on the client side (see line 73); cast is safe
  ...(parsedServer.data as z.infer<typeof serverSchema>),
} as Env
