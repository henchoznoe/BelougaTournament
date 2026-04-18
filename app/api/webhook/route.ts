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
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import { getStripe, getStripeWebhookSecret } from '@/lib/core/stripe'
import { removeUserFromTeam } from '@/lib/utils/team'
import {
  PaymentStatus,
  RegistrationStatus,
} from '@/prisma/generated/prisma/enums'

const handleCheckoutCompleted = async (event: Stripe.Event) => {
  const stripe = getStripe()
  const session = event.data.object as Stripe.Checkout.Session
  const paymentId = session.metadata?.paymentId

  if (!paymentId) {
    logger.warn(
      { eventId: event.id },
      'Stripe checkout session without paymentId metadata',
    )
    return
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      registration: {
        select: { id: true },
      },
    },
  })

  if (!payment || payment.status === PaymentStatus.PAID) {
    return
  }

  let chargeId: string | null = null
  let paymentIntentId: string | null = null

  if (typeof session.payment_intent === 'string') {
    paymentIntentId = session.payment_intent

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent,
      )
      chargeId =
        typeof paymentIntent.latest_charge === 'string'
          ? paymentIntent.latest_charge
          : null
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

  const terminalStatuses = new Set<PaymentStatus>([
    PaymentStatus.PAID,
    PaymentStatus.CANCELLED,
    PaymentStatus.FAILED,
    PaymentStatus.REFUNDED,
  ])

  if (!payment || terminalStatuses.has(payment.status)) {
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

  const terminalStatuses = new Set<PaymentStatus>([
    PaymentStatus.PAID,
    PaymentStatus.CANCELLED,
    PaymentStatus.FAILED,
    PaymentStatus.REFUNDED,
  ])

  if (!payment || terminalStatuses.has(payment.status)) {
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

const handleChargeRefunded = async (event: Stripe.Event) => {
  const charge = event.data.object as Stripe.Charge

  // H4: Fallback lookup by stripePaymentIntentId when stripeChargeId is not found
  let payment = await prisma.payment.findFirst({
    where: { stripeChargeId: charge.id },
    include: { registration: { select: { id: true } } },
  })

  if (!payment && typeof charge.payment_intent === 'string') {
    payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: charge.payment_intent },
      include: { registration: { select: { id: true } } },
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
      await tx.tournamentRegistration.update({
        where: { id: payment.registration.id },
        data: {
          status: RegistrationStatus.CANCELLED,
          paymentStatus: PaymentStatus.REFUNDED,
          cancelledAt: new Date(),
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

  const alreadyProcessed = await prisma.stripeWebhookEvent.findUnique({
    where: { stripeEventId: event.id },
    select: { id: true },
  })

  if (alreadyProcessed) {
    logger.info({ eventId: event.id }, 'Stripe webhook already processed')
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    // Insert idempotency record BEFORE processing to prevent double-processing on retries
    await prisma.stripeWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
      },
    })

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
      default:
        break
    }

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_PAYMENTS, 'minutes')

    return NextResponse.json({ received: true })
  } catch (error) {
    // Delete idempotency record on failure so Stripe can retry
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
}
