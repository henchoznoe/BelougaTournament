/**
 * File: app/api/webhook/route.ts
 * Description: Stripe webhook endpoint for tournament registration payments.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { CACHE_TAGS } from '@/lib/config/constants'
import { env } from '@/lib/core/env'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import { getStripe, getStripeWebhookSecret } from '@/lib/core/stripe'
import { removeUserFromTeam } from '@/lib/utils/team'
import { Prisma } from '@/prisma/generated/prisma/client'
import {
  PaymentStatus,
  RegistrationStatus,
} from '@/prisma/generated/prisma/enums'

/** Payment statuses that are considered final — no further transitions are allowed. */
const TERMINAL_PAYMENT_STATUSES = new Set<PaymentStatus>([
  PaymentStatus.PAID,
  PaymentStatus.CANCELLED,
  PaymentStatus.FAILED,
  PaymentStatus.REFUNDED,
])

const handleCheckoutCompleted = async (event: Stripe.Event) => {
  const stripe = getStripe()
  // Safe: this handler is only called from the switch branch for 'checkout.session.completed'
  const session = event.data.object as Stripe.Checkout.Session
  const paymentId = session.metadata?.paymentId

  if (!paymentId) {
    logger.warn(
      { eventId: event.id },
      'Stripe checkout session without paymentId metadata',
    )
    return
  }

  // Verify the session actually completed with a paid charge. `checkout.session.completed`
  // also fires for sessions that completed without immediate payment (e.g. async payment
  // methods still pending), so we must require both status and payment_status.
  if (session.status !== 'complete' || session.payment_status !== 'paid') {
    logger.warn(
      {
        eventId: event.id,
        sessionStatus: session.status,
        paymentStatus: session.payment_status,
      },
      'Checkout session not in paid/complete state — skipping confirmation',
    )
    return
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      status: true,
      amount: true,
      currency: true,
      registration: {
        select: { id: true },
      },
    },
  })

  if (!payment || payment.status === PaymentStatus.PAID) {
    return
  }

  // Verify that the amount Stripe actually collected matches the amount we recorded
  // when creating the checkout session. A mismatch indicates tampering or a
  // re-priced session and must never be confirmed.
  if (session.amount_total !== payment.amount) {
    logger.error(
      {
        eventId: event.id,
        expected: payment.amount,
        actual: session.amount_total,
        paymentId,
      },
      'Checkout session amount_total mismatch — refusing to confirm',
    )
    return
  }

  const sessionCurrency = session.currency?.toUpperCase() ?? null
  if (sessionCurrency !== payment.currency.toUpperCase()) {
    logger.error(
      {
        eventId: event.id,
        expectedCurrency: payment.currency,
        actualCurrency: session.currency ?? null,
        paymentId,
      },
      'Checkout session currency mismatch — refusing to confirm',
    )
    return
  }

  let chargeId: string | null = null
  let paymentIntentId: string | null = null
  // Stripe processing fee in the platform currency (centimes). Retrieved from the
  // balance_transaction so the dashboard can display true net revenue without estimation.
  let stripeFee: number | null = null

  if (typeof session.payment_intent === 'string') {
    paymentIntentId = session.payment_intent

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent,
        { expand: ['latest_charge.balance_transaction'] },
      )

      if (typeof paymentIntent.latest_charge === 'string') {
        chargeId = paymentIntent.latest_charge
      } else if (paymentIntent.latest_charge) {
        chargeId = paymentIntent.latest_charge.id

        // balance_transaction is expanded — read the fee directly
        const bt = paymentIntent.latest_charge.balance_transaction
        if (bt && typeof bt !== 'string') {
          stripeFee = bt.fee
        }
      }
    } catch (error) {
      logger.warn(
        { error, eventId: event.id },
        'Failed to retrieve Stripe payment intent after checkout completion',
      )
    }
  }

  await prisma.$transaction(async tx => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PAID,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        stripeChargeId: chargeId,
        stripeCustomerId:
          typeof session.customer === 'string' ? session.customer : null,
        stripeFee,
        paidAt: new Date(),
      },
    })

    await tx.tournamentRegistration.update({
      where: { id: payment.registration.id },
      data: {
        status: RegistrationStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        confirmedAt: new Date(),
        expiresAt: null,
      },
    })
  })
}

const handleCheckoutExpired = async (event: Stripe.Event) => {
  // Safe: this handler is only called from the switch branch for 'checkout.session.expired'
  const session = event.data.object as Stripe.Checkout.Session

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { stripeCheckoutSessionId: session.id },
        ...(session.metadata?.paymentId
          ? [{ id: session.metadata.paymentId }]
          : []),
      ],
    },
    include: {
      registration: {
        select: {
          id: true,
          userId: true,
          tournamentId: true,
          status: true,
        },
      },
    },
  })

  if (!payment || TERMINAL_PAYMENT_STATUSES.has(payment.status)) {
    return
  }

  await prisma.$transaction(async tx => {
    await removeUserFromTeam(
      tx,
      payment.registration.userId,
      payment.registration.tournamentId,
    )

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.CANCELLED,
        stripeCheckoutSessionId: session.id,
      },
    })

    await tx.tournamentRegistration.update({
      where: { id: payment.registration.id },
      data: {
        status: RegistrationStatus.EXPIRED,
        paymentStatus: PaymentStatus.CANCELLED,
        expiresAt: new Date(),
        teamId: null,
      },
    })
  })
}

const handlePaymentFailed = async (event: Stripe.Event) => {
  // Safe: this handler is only called from the switch branch for 'payment_intent.payment_failed'
  const paymentIntent = event.data.object as Stripe.PaymentIntent
  const paymentId = paymentIntent.metadata.paymentId

  if (!paymentId) {
    return
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      registration: {
        select: {
          id: true,
          userId: true,
          tournamentId: true,
        },
      },
    },
  })

  if (!payment || TERMINAL_PAYMENT_STATUSES.has(payment.status)) {
    return
  }

  await prisma.$transaction(async tx => {
    await removeUserFromTeam(
      tx,
      payment.registration.userId,
      payment.registration.tournamentId,
    )

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        stripePaymentIntentId: paymentIntent.id,
      },
    })

    await tx.tournamentRegistration.update({
      where: { id: payment.registration.id },
      data: {
        status: RegistrationStatus.EXPIRED,
        paymentStatus: PaymentStatus.FAILED,
        expiresAt: new Date(),
        teamId: null,
      },
    })
  })
}

/**
 * Backfills the Stripe processing fee on a payment record when charge.updated fires.
 *
 * The balance_transaction is created asynchronously by Stripe and may not be
 * available yet when checkout.session.completed is processed. This handler runs
 * whenever a charge is updated and writes the fee if it is still missing.
 */
const handleChargeUpdated = async (event: Stripe.Event) => {
  // Safe: this handler is only called from the switch branch for 'charge.updated'
  const charge = event.data.object as Stripe.Charge

  // Only process charges that have a balance_transaction (string ID or expanded object)
  if (!charge.balance_transaction) {
    return
  }

  const payment = await prisma.payment.findFirst({
    where: { stripeChargeId: charge.id },
    select: { id: true, stripeFee: true },
  })

  // Skip if no matching payment or fee is already stored (idempotent)
  if (!payment || payment.stripeFee !== null) {
    return
  }

  // Stripe webhook events send the balance_transaction as a string ID (not expanded).
  // We must retrieve the full object from the API to read the fee.
  let fee: number
  if (typeof charge.balance_transaction === 'string') {
    const stripe = getStripe()
    const bt = await stripe.balanceTransactions.retrieve(
      charge.balance_transaction,
    )
    fee = bt.fee
  } else {
    fee = charge.balance_transaction.fee
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeFee: fee },
  })
}

const handleChargeRefunded = async (event: Stripe.Event) => {
  // Safe: this handler is only called from the switch branch for 'charge.refunded'
  const charge = event.data.object as Stripe.Charge

  // H4: Fallback lookup by stripePaymentIntentId when stripeChargeId is not found
  let payment = await prisma.payment.findFirst({
    where: { stripeChargeId: charge.id },
    include: {
      registration: {
        select: { id: true, userId: true, tournamentId: true },
      },
    },
  })

  if (!payment && typeof charge.payment_intent === 'string') {
    payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: charge.payment_intent },
      include: {
        registration: {
          select: { id: true, userId: true, tournamentId: true },
        },
      },
    })
  }

  if (!payment) {
    return
  }

  // C2: Only cancel the registration on a full refund; partial refunds only update the payment
  const isFullRefund = charge.amount_refunded >= charge.amount

  await prisma.$transaction(async tx => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? PaymentStatus.REFUNDED : payment.status,
        refundAmount: charge.amount_refunded,
        refundedAt: new Date(),
      },
    })

    if (isFullRefund) {
      await removeUserFromTeam(
        tx,
        payment.registration.userId,
        payment.registration.tournamentId,
      )

      await tx.tournamentRegistration.update({
        where: { id: payment.registration.id },
        data: {
          status: RegistrationStatus.CANCELLED,
          paymentStatus: PaymentStatus.REFUNDED,
          cancelledAt: new Date(),
          teamId: null,
          expiresAt: null,
        },
      })
    }
  })
}

export const POST = async (request: Request) => {
  const stripe = getStripe()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing Stripe signature.' },
      { status: 400 },
    )
  }

  const body = await request.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      getStripeWebhookSecret(),
    )

    logger.info(
      {
        eventId: event.id,
        type: event.type,
        livemode: event.livemode,
      },
      'Stripe webhook received',
    )
  } catch (error) {
    logger.error({ error }, 'Invalid Stripe webhook signature')
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  // Enforce livemode/environment symmetry so test-mode events signed with a
  // leaked test secret cannot mutate production data (and vice-versa).
  // Use VERCEL_ENV (not NODE_ENV) because Vercel sets NODE_ENV=production on
  // all deployed environments including preview branches; VERCEL_ENV correctly
  // distinguishes 'production' from 'preview' and is undefined in local dev.
  const expectedLivemode = env.VERCEL_ENV === 'production'
  if (event.livemode !== expectedLivemode) {
    logger.warn(
      {
        eventId: event.id,
        livemode: event.livemode,
        vercelEnv: env.VERCEL_ENV,
        nodeEnv: env.NODE_ENV,
      },
      'Stripe webhook livemode does not match runtime environment — rejecting',
    )
    return NextResponse.json({ error: 'Livemode mismatch.' }, { status: 400 })
  }

  try {
    // Atomic idempotency guard: insert before processing; P2002 = duplicate, return early
    await prisma.stripeWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
      },
    })
  } catch (idempotencyError) {
    if (
      idempotencyError instanceof Prisma.PrismaClientKnownRequestError &&
      idempotencyError.code === 'P2002'
    ) {
      logger.info({ eventId: event.id }, 'Stripe webhook already processed')
      return NextResponse.json({ received: true, duplicate: true })
    }
    logger.error(
      { error: idempotencyError, eventId: event.id },
      'Failed to insert Stripe webhook idempotency record',
    )
    return NextResponse.json(
      { error: 'Webhook processing failed.' },
      { status: 500 },
    )
  }

  // Only handler failures (DB work) should release the idempotency row so
  // Stripe retries the event. Post-handler cache revalidation runs outside the
  // try so a failing `revalidateTag` cannot cause the handler's DB mutations
  // to be replayed on retry.
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event)
        break
      case 'checkout.session.expired':
        await handleCheckoutExpired(event)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event)
        break
      case 'charge.refunded':
        await handleChargeRefunded(event)
        break
      case 'charge.updated':
        await handleChargeUpdated(event)
        break
      default:
        break
    }
  } catch (error) {
    // Release the idempotency row so Stripe can retry the delivery.
    try {
      await prisma.stripeWebhookEvent.delete({
        where: { stripeEventId: event.id },
      })
    } catch {
      // Ignore if delete fails (record may not exist if create failed)
    }

    logger.error(
      { error, eventId: event.id, type: event.type },
      'Failed to process Stripe webhook',
    )
    return NextResponse.json(
      { error: 'Webhook processing failed.' },
      { status: 500 },
    )
  }

  try {
    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_PAYMENTS, 'minutes')
  } catch (error) {
    // Cache revalidation failures are non-fatal; the mutations have already
    // been persisted. Logging only — do not release the idempotency row.
    logger.warn(
      { error, eventId: event.id, type: event.type },
      'Stripe webhook cache revalidation failed',
    )
  }

  return NextResponse.json({ received: true })
}
