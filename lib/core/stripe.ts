/**
 * File: lib/core/stripe.ts
 * Description: Lazy Stripe SDK accessors and shared payment constants.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import Stripe from 'stripe'
import { env } from '@/lib/core/env'

export const REGISTRATION_HOLD_MINUTES = 30

let stripeClient: Stripe | null = null

/** Returns a singleton Stripe client once the project is configured. */
export const getStripe = () => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured.')
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY)
  }

  return stripeClient
}

/** Returns the webhook secret or throws when Stripe webhooks are not configured. */
export const getStripeWebhookSecret = () => {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured.')
  }

  return env.STRIPE_WEBHOOK_SECRET
}
