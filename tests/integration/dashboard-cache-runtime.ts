/**
 * File: tests/integration/dashboard-cache-runtime.ts
 * Description: Verifies dashboard rendering and tag expiration against a production server and isolated PostgreSQL.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import assert from 'node:assert/strict'
import { createHmac, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../prisma/generated/prisma/client.ts'
import {
  PaymentProvider,
  PaymentStatus,
  RegistrationStatus,
  RegistrationType,
  Role,
  TournamentFormat,
  TournamentStatus,
} from '../../prisma/generated/prisma/enums.ts'

const origin = new URL(process.env.CACHE_TEST_ORIGIN ?? 'http://localhost:3300')
const databaseUrl = process.env.DATABASE_URL ?? ''
assert(['localhost', '127.0.0.1'].includes(origin.hostname))
assert(['localhost', '127.0.0.1'].includes(new URL(databaseUrl).hostname))
assert(new URL(databaseUrl).pathname.includes('cache_test'))
const secret = process.env.BETTER_AUTH_SECRET
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
assert(secret && webhookSecret, 'Supply the isolated app signing secrets')
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
})
const manifest = JSON.parse(
  await readFile(
    path.join(
      process.argv[2] ?? '.',
      '.next/server/server-reference-manifest.json',
    ),
    'utf8',
  ),
) as { node: Record<string, { exportedName?: string }> }
const prefix = `dashboard-${Date.now()}`
const userIds: string[] = []
const eventIds: string[] = []
let tournamentId: string | undefined
const report = (message: string) => console.info(`✓ ${message}`)

const createUser = async (role: Role = Role.USER) => {
  const user = await prisma.user.create({
    data: {
      name: prefix,
      displayName: prefix,
      email: `${randomUUID()}@cache-test.invalid`,
      emailVerified: true,
      role,
    },
  })
  userIds.push(user.id)
  return user
}
const cookieFor = async (userId: string) => {
  const token = randomUUID()
  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + 86_400_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  return `belouga.session_token=${encodeURIComponent(`${token}.${createHmac('sha256', secret).update(token).digest('base64')}`)}`
}
const dashboard = async (cookie: string) => {
  const response = await fetch(new URL('/admin', origin), {
    headers: { cookie },
  })
  assert.equal(response.status, 200)
  assert.equal(
    new URL(response.url).pathname,
    '/admin',
    'Admin session must authenticate',
  )
  return (await response.text())
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
}
const action = async (name: string, data: unknown, cookie: string) => {
  const id = Object.entries(manifest.node).find(
    ([, value]) => value.exportedName === name,
  )?.[0]
  assert(id, `Missing action ${name}`)
  const response = await fetch(new URL('/admin/users', origin), {
    method: 'POST',
    headers: {
      cookie,
      origin: origin.origin,
      'content-type': 'text/plain;charset=UTF-8',
      'next-action': id,
    },
    body: JSON.stringify([data]),
  })
  assert.equal(response.status, 200)
  assert.match(await response.text(), /"success":true/, `${name} must succeed`)
}
const webhook = async (
  type: string,
  object: unknown,
  id = `evt_${randomUUID()}`,
) => {
  eventIds.push(id)
  const body = JSON.stringify({ id, type, livemode: false, data: { object } })
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${body}`)
    .digest('hex')
  const response = await fetch(new URL('/api/webhook', origin), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'stripe-signature': `t=${timestamp},v1=${signature}`,
    },
    body,
  })
  assert.equal(response.status, 200)
  return { id, result: await response.json() }
}

try {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(new URL('/api/auth/get-session', origin), {
        signal: AbortSignal.timeout(1000),
      })
      assert.equal(response.status, 200)
      break
    } catch (error) {
      if (attempt === 49) throw error
      await setTimeout(200)
    }
  }
  // These fixtures are created after the build. A dashboard frozen into the
  // prerendered shell would still display the build-time counts and revenues.
  const initialUsers = await prisma.user.count()
  assert.equal(
    initialUsers,
    0,
    'Use an empty isolated database for this scenario',
  )
  assert.equal(
    await prisma.payment.count(),
    0,
    'No existing payments may be present',
  )
  assert.equal(
    await prisma.sponsor.count(),
    0,
    'No existing sponsors may be present',
  )
  assert.equal(
    await prisma.tournament.count(),
    0,
    'No existing tournaments may be present',
  )
  const admin = await createUser(Role.SUPER_ADMIN)
  const player = await createUser()
  const cookie = await cookieFor(admin.id)
  const secondCookie = await cookieFor(admin.id)
  const tournament = await prisma.tournament.create({
    data: {
      title: prefix,
      slug: prefix,
      description: 'Dashboard cache verification',
      startDate: new Date(Date.now() + 86_400_000),
      endDate: new Date(Date.now() + 172_800_000),
      registrationOpen: new Date(Date.now() - 86_400_000),
      registrationClose: new Date(Date.now() + 43_200_000),
      games: ['Valorant'],
      imageUrls: [],
      format: TournamentFormat.SOLO,
      registrationType: RegistrationType.PAID,
      entryFeeAmount: 500,
      entryFeeCurrency: 'CHF',
      status: TournamentStatus.PUBLISHED,
    },
  })
  tournamentId = tournament.id
  const registration = await prisma.tournamentRegistration.create({
    data: {
      tournamentId,
      userId: player.id,
      status: RegistrationStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    },
  })
  const payment = await prisma.payment.create({
    data: {
      registrationId: registration.id,
      provider: PaymentProvider.STRIPE,
      amount: 500,
      currency: 'CHF',
    },
  })
  const first = await dashboard(cookie)
  assert.match(first, new RegExp(`Utilisateurs ${initialUsers + 2} `))
  assert.match(first, /Tournois 1 1 publié/)
  assert.match(first, new RegExp(`Inscriptions récentes.*${prefix}`))
  assert.match(first, /Total encaissé 0\.00 CHF 0 paiement/)
  report(
    'First authenticated request uses post-build accounts and registrations',
  )
  await dashboard(secondCookie)

  const newcomer = await createUser()
  await action(
    'updateUser',
    { userId: newcomer.id, displayName: 'Fresh account' },
    cookie,
  )
  assert.match(
    await dashboard(secondCookie),
    new RegExp(`Utilisateurs ${initialUsers + 3} `),
  )
  report('Account invalidation refreshes warmed counters in a second session')
  await action('promoteToAdmin', { userId: player.id }, cookie)
  assert.match(await dashboard(secondCookie), /1 admin · 1 super admin/)
  report('Role mutation immediately refreshes dashboard role counts')

  await action(
    'createSponsor',
    {
      name: prefix,
      imageUrls: ['https://cache-test.invalid/logo.png'],
      url: '',
      supportedSince: '2026-01-01',
    },
    cookie,
  )
  const sponsor = await prisma.sponsor.findFirstOrThrow({
    where: { name: prefix },
  })
  assert.match(await dashboard(secondCookie), /Sponsors 1 1 actif · 0 inactif/)
  await action('toggleSponsorStatus', { id: sponsor.id }, cookie)
  assert.match(await dashboard(secondCookie), /Sponsors 1 0 actif · 1 inactif/)
  report(
    'Sponsor creation and deactivation refresh the warmed dashboard counters',
  )

  const completed = {
    id: `cs_test_${randomUUID()}`,
    status: 'complete',
    payment_status: 'paid',
    amount_total: 500,
    currency: 'chf',
    payment_intent: null,
    metadata: { paymentId: payment.id },
  }
  const confirmation = await webhook('checkout.session.completed', completed)
  assert.match(
    await dashboard(secondCookie),
    /Total encaissé 5\.00 CHF 1 paiement/,
  )
  assert.match(await dashboard(cookie), /Capital net Belouga 5\.00 CHF/)
  const duplicate = await webhook(
    'checkout.session.completed',
    completed,
    confirmation.id,
  )
  assert.equal(duplicate.result.duplicate, true)
  assert.match(
    await dashboard(secondCookie),
    /Total encaissé 5\.00 CHF 1 paiement/,
  )
  report(
    'Payment webhook refreshes first read in both sessions without double counting',
  )

  // Expanded event fixtures avoid calling the Stripe API or charging a card.
  const chargeId = `ch_test_${randomUUID()}`
  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeChargeId: chargeId },
  })
  await webhook('charge.updated', {
    id: chargeId,
    balance_transaction: { fee: 44 },
  })
  const withFees = await dashboard(secondCookie)
  assert.match(withFees, /Capital net Belouga 4\.56 CHF/)
  assert.match(withFees, /Frais Stripe 0\.44 CHF/)
  report('Fee backfill immediately updates net revenue and Stripe fees')

  await webhook('charge.refunded', {
    id: chargeId,
    amount: 500,
    amount_refunded: 500,
  })
  const refunded = await dashboard(secondCookie)
  assert.match(refunded, /Remboursé 5\.00 CHF 1 remboursement/)
  assert.match(refunded, /Capital net Belouga -0\.44 CHF/)
  report('Refund webhook immediately updates the warmed finance widget')
} finally {
  await prisma.sponsor.deleteMany({ where: { name: prefix } })
  await prisma.stripeWebhookEvent.deleteMany({
    where: { stripeEventId: { in: eventIds } },
  })
  if (tournamentId)
    await prisma.tournament.delete({ where: { id: tournamentId } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  await prisma.$disconnect()
}
