/**
 * File: lib/core/logger.ts
 * Description: Lightweight structured logger using native console.
 *   In development, outputs readable formatted messages.
 *   In production, outputs JSON so Vercel can index and filter log entries.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'

type LogLevel = 'info' | 'warn' | 'error'
type LogContext = Record<string, unknown>

const isDev = process.env.NODE_ENV === 'development'

/** Formats a log entry as a readable string (dev) or structured JSON (prod). */
const buildEntry = (
  level: LogLevel,
  ctx: LogContext,
  message: string,
): string => {
  if (isDev) {
    const ctxStr = Object.keys(ctx).length ? ` ${JSON.stringify(ctx)}` : ''
    return `[${level.toUpperCase()}] ${message}${ctxStr}`
  }
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...ctx,
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
