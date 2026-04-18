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
import {
  PaymentStatus,
  RegistrationStatus,
} from '@/prisma/generated/prisma/enums'

type TeamWithMembers = {
  id: string
  captainId: string
  tournament: { teamSize: number }
  members: { userId: string }[]
}

type TeamMemberWithTeam = {
  team: TeamWithMembers
}

const syncTeamFullState = async (
  tx: Pick<typeof prisma, 'team' | 'teamMember'>,
  teamId: string,
  teamSize: number,
) => {
  const memberCount = await tx.teamMember.count({ where: { teamId } })

  await tx.team.update({
    where: { id: teamId },
    data: { isFull: memberCount >= teamSize },
  })
}

const removeUserFromTeam = async (
  tx: Pick<typeof prisma, 'team' | 'teamMember'>,
  userId: string,
  tournamentId: string,
) => {
  const teamMember = (await tx.teamMember.findFirst({
    where: { userId, team: { tournamentId } },
    include: {
      team: {
        include: {
          tournament: { select: { teamSize: true } },
          members: { orderBy: { joinedAt: 'asc' } },
        },
      },
    },
  })) as TeamMemberWithTeam | null

  if (!teamMember) {
    return
  }

  const team = teamMember.team
  const otherMembers = team.members.filter(member => member.userId !== userId)
  const isCaptain = team.captainId === userId

  await tx.teamMember.deleteMany({ where: { teamId: team.id, userId } })

  if (otherMembers.length === 0) {
    await tx.team.delete({ where: { id: team.id } })
    return
  }

  if (isCaptain) {
    await tx.team.update({
      where: { id: team.id },
      data: { captainId: otherMembers[0].userId },
    })
  }

  await syncTeamFullState(tx, team.id, team.tournament.teamSize)
}

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

  if (!payment || payment.status === PaymentStatus.PAID) {
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

  if (!payment || payment.status === PaymentStatus.PAID) {
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

  const payment = await prisma.payment.findFirst({
    where: { stripeChargeId: charge.id },
    include: { registration: { select: { id: true } } },
  })

  if (!payment) {
    return
  }

  await prisma.$transaction(async tx => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.REFUNDED,
        refundAmount: charge.amount_refunded,
        refundedAt: new Date(),
      },
    })

    await tx.tournamentRegistration.update({
      where: { id: payment.registration.id },
      data: {
        status: RegistrationStatus.CANCELLED,
        paymentStatus: PaymentStatus.REFUNDED,
        cancelledAt: new Date(),
      },
    })
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

    await prisma.stripeWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
      },
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')
    revalidateTag(CACHE_TAGS.REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_REGISTRATIONS, 'minutes')
    revalidateTag(CACHE_TAGS.DASHBOARD_STATS, 'minutes')

    return NextResponse.json({ received: true })
  } catch (error) {
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
