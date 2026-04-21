/**
 * File: lib/core/logger.ts
 * Description: Lightweight structured logger using native console.
 *   In development, outputs readable formatted messages.
 *   In production, outputs JSON so Vercel can index and filter log entries.
 *   Redacts common credential-bearing keys (authorization headers, tokens,
 *   cookies, Stripe signatures) so accidental `{ error }` spreads don't leak
 *   secrets when the error carries a fetch Request/Response.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { env } from '@/lib/core/env'

type LogLevel = 'info' | 'warn' | 'error'
type LogContext = Record<string, unknown>

const isDev = env.NODE_ENV === 'development'

const REDACTED = '[REDACTED]'

/** Keys whose values must never be logged (case-insensitive match). */
const SENSITIVE_KEYS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'password',
  'token',
  'access_token',
  'refresh_token',
  'accesstoken',
  'refreshtoken',
  'client_secret',
  'clientsecret',
  'api_key',
  'apikey',
  'stripe-signature',
])

const MAX_DEPTH = 6

/**
 * Recursively clones the context, replacing any value whose key matches a
 * sensitive name with `[REDACTED]`. Safe against cycles via depth-bounding.
 * The overload ensures that a `LogContext` input always returns a `LogContext`,
 * eliminating the need for a cast at the call site.
 */
function redact(value: LogContext, depth?: number): LogContext
function redact(value: unknown, depth?: number): unknown
function redact(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return REDACTED
  if (value === null || typeof value !== 'object') return value
  if (value instanceof Error) {
    return { name: value.name, message: value.message }
  }
  if (Array.isArray(value)) {
    return value.map(item => redact(item, depth + 1))
  }
  const out: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      out[key] = REDACTED
    } else {
      out[key] = redact(val, depth + 1)
    }
  }
  return out
}

/** Formats a log entry as a readable string (dev) or structured JSON (prod). */
const buildEntry = (
  level: LogLevel,
  ctx: LogContext,
  message: string,
): string => {
  const safeCtx = redact(ctx)
  if (isDev) {
    const ctxStr = Object.keys(safeCtx).length
      ? ` ${JSON.stringify(safeCtx)}`
      : ''
    return `[${level.toUpperCase()}] ${message}${ctxStr}`
  }
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...safeCtx,
  })
}

/**
 * Zero-dependency application logger.
 * Outputs structured JSON in production (picked up by Vercel log viewer)
 * and readable text in development.
 *
 * Usage: logger.error({ userId, error }, 'Failed to create tournament')
 */
export const logger = {
  info: (ctx: LogContext, message: string): void => {
    console.info(buildEntry('info', ctx, message))
  },
  warn: (ctx: LogContext, message: string): void => {
    console.warn(buildEntry('warn', ctx, message))
  },
  error: (ctx: LogContext, message: string): void => {
    console.error(buildEntry('error', ctx, message))
  },
}
