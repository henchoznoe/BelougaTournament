/**
 * File: lib/config/constants/stripe.ts
 * Description: Stripe snapshot events handled by the application's webhook endpoint.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export const STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'checkout.session.expired',
  'payment_intent.payment_failed',
  'payment_intent.canceled',
  'charge.refunded',
  'charge.updated',
  'charge.dispute.created',
] as const
