/**
 * File: lib/core/resend.ts
 * Description: Lazy Resend SDK accessor for transactional email sending.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { Resend } from 'resend'
import { env } from '@/lib/core/env'

let resendClient: Resend | null = null

/** Returns a singleton Resend client once the project is configured. */
export const getResend = (): Resend => {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured.')
  }

  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY)
  }

  return resendClient
}
