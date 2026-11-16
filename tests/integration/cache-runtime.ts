/**
 * File: tests/integration/cache-runtime.ts
 * Description: Exercises warm Next.js production caches with isolated player sessions and signed webhooks.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import assert from 'node:assert/strict'
import { createHmac, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../prisma/generated/prisma/client.ts'
import {
  RegistrationType,
  Role,
  TournamentFormat,
  TournamentStatus,
} from '../../prisma/generated/prisma/enums.ts'

const origin = new URL(process.env.CACHE_TEST_ORIGIN ?? 'http://localhost:3300')
const databaseUrl = process.env.DATABASE_URL ?? ''
assert(
  ['localhost', '127.0.0.1'].includes(origin.hostname),
  'Only an isolated local app may be tested',
)
assert(
  ['localhost', '127.0.0.1'].includes(new URL(databaseUrl).hostname),
  'Only a local test database may be mutated',
)
assert(
  new URL(databaseUrl).pathname.includes('cache_test'),
  'Use a dedicated cache_test database',
)
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
) as {
  node: Record<string, { exportedName?: string }>
}
const prefix = `cc-${Date.now()}`
const slug = `${prefix}-paid`
const route = `/tournaments/${slug}`
const userIds: string[] = []
let tournamentId: string | undefined
const report = (message: string) => console.info(`✓ ${message}`)

const session = async (name: string, role: Role = Role.USER) => {
  const user = await prisma.user.create({
    data: {
      name,
      displayName: name,
      email: `${randomUUID()}@cache-test.invalid`,
      emailVerified: true,
      isPublic: true,
      role,
    },
  })
  userIds.push(user.id)
  const token = randomUUID()
  await prisma.session.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 86_400_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  const signed = `${token}.${createHmac('sha256', secret).update(token).digest('base64')}`
  return {
    user,
    cookie: `${origin.protocol === 'https:' ? '__Secure-' : ''}belouga.session_token=${encodeURIComponent(signed)}`,
  }
}

const get = async (pathname: string, cookie?: string) => {
  const response = await fetch(new URL(pathname, origin), {
    headers: cookie ? { cookie } : undefined,
  })
  const html = await response.text()
  let flight = ''
  for (const match of html.matchAll(
    /self\.__next_f\.push\((\[[^\n]*?\])\)<\/script>/g,
  )) {
    try {
      const value = JSON.parse(match[1])
      if (value[0] === 1) flight += value[1]
    } catch {
      /* Other script content. */
    }
  }
  return { response, html, flight }
}
const participation = async () => {
  const page = await get(route)
  assert.equal(page.response.status, 200)
  const counts = page.flight.match(
    /"_count":\{"registrations":(\d+),"teams":(\d+)\}/,
  )
  assert(
    counts,
    'Tournament count must be present in the fresh server response',
  )
  const available = page.flight.match(
    /"availableTeams":(\[.*?\]),"registrants":/,
  )
  assert(
    available,
    'Available teams must be serialized independently from showRegistrants',
  )
  return {
    registrations: Number(counts[1]),
    teams: Number(counts[2]),
    available: JSON.parse(available[1]) as { id: string; name: string }[],
  }
}
const action = async (name: string, data: unknown, cookie: string) => {
  const id = Object.entries(manifest.node).find(
    ([, value]) => value.exportedName === name,
  )?.[0]
  assert(id, `Server action ${name} must exist in the build`)
  const response = await fetch(new URL(route, origin), {
    method: 'POST',
    headers: {
      cookie,
      origin: origin.origin,
      'content-type': 'text/plain;charset=UTF-8',
      'next-action': id,
    },
    body: JSON.stringify([data]),
  })
  const flight = await response.text()
  assert.equal(
    response.status,
    200,
    `Action ${name} HTTP error: ${flight.slice(0, 200)}`,
  )
  const result = flight.split('\n').flatMap(line => {
    try {
      const object = JSON.parse(line.slice(line.indexOf(':') + 1))
      return typeof object?.success === 'boolean' ? [object] : []
    } catch {
      return []
    }
  })[0] as
    | { success: boolean; message?: string; data?: { checkoutUrl?: string } }
    | undefined
  assert(result?.success, `${name}: ${result?.message ?? flight.slice(-300)}`)
  return result
}
const webhook = async (
  type: string,
  object: unknown,
  id = `evt_${randomUUID()}`,
) => {
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
  return { id, response: await response.json() }
}

try {
  const captain = await session(`${prefix}-captain`)
  const member = await session(`${prefix}-member`)
  const admin = await session(`${prefix}-admin`, Role.SUPER_ADMIN)
  const tournament = await prisma.tournament.create({
    data: {
      title: `${prefix} paid`,
      slug,
      description: 'Local cache verification',
      startDate: new Date(Date.now() + 86_400_000),
      endDate: new Date(Date.now() + 172_800_000),
      registrationOpen: new Date(Date.now() - 86_400_000),
      registrationClose: new Date(Date.now() + 43_200_000),
      games: ['Valorant'],
      imageUrls: [],
      format: TournamentFormat.TEAM,
      teamSize: 2,
      maxTeams: 32,
      registrationType: RegistrationType.PAID,
      entryFeeAmount: 500,
      entryFeeCurrency: 'CHF',
      status: TournamentStatus.PUBLISHED,
      showRegistrants: false,
    },
  })
  tournamentId = tournament.id
  const checkSession = await fetch(new URL('/api/auth/get-session', origin), {
    headers: { cookie: captain.cookie },
  })
  assert.equal(
    (await checkSession.json())?.user?.id,
    captain.user.id,
    'Signed test session must authenticate',
  )
  await get('/admin', admin.cookie)
  await get(`/admin/tournaments/${slug}?tab=registrations`, admin.cookie)
  await get('/players')
  assert.equal((await participation()).teams, 0)
  assert.equal((await participation()).available.length, 0)
  report('Anonymous, player and admin caches warmed with zero teams')

  const created = await action(
    'createTeamAndRegister',
    {
      tournamentId,
      teamName: `${prefix}-team`,
      returnPath: route,
      fieldValues: {},
    },
    captain.cookie,
  )
  assert(
    created.data?.checkoutUrl,
    'Paid registration must produce a checkout URL through the local Stripe stand-in',
  )
  let state = await participation()
  assert.equal(state.teams, 1)
  assert.equal(state.available.length, 1)
  assert.equal(state.registrations, 0)
  const teamId = state.available[0].id
  report(
    'First anonymous read sees the paid team before payment, with showRegistrants disabled',
  )
  await get('/profile', captain.cookie)
  await action(
    'joinTeamAndRegister',
    { tournamentId, teamId, returnPath: route, fieldValues: {} },
    member.cookie,
  )
  state = await participation()
  assert.equal(state.teams, 1)
  assert.equal(state.available.length, 0)
  await get('/profile', member.cookie)
  report(
    'Second player joins and the full team disappears from available teams immediately',
  )

  const renamed = `${prefix}-renamed`
  await action('adminUpdateTeamName', { teamId, name: renamed }, admin.cookie)
  assert((await get('/profile', captain.cookie)).flight.includes(renamed))
  assert((await get('/profile', member.cookie)).flight.includes(renamed))
  report('Team rename refreshes both warmed player profiles')

  const payment = await prisma.payment.findFirstOrThrow({
    where: { registration: { userId: captain.user.id, tournamentId } },
  })
  const completed = {
    id: payment.stripeCheckoutSessionId,
    status: 'complete',
    payment_status: 'paid',
    amount_total: 500,
    currency: 'chf',
    payment_intent: null,
    metadata: { paymentId: payment.id },
  }
  const confirmation = await webhook('checkout.session.completed', completed)
  assert.equal((await participation()).registrations, 1)
  const duplicate = await webhook(
    'checkout.session.completed',
    completed,
    confirmation.id,
  )
  assert.equal(duplicate.response.duplicate, true)
  assert.equal(
    await prisma.payment.count({
      where: { registration: { userId: captain.user.id, tournamentId } },
    }),
    1,
  )
  report(
    'Signed webhook refreshes the first public read; duplicate delivery does not duplicate payment',
  )

  await action(
    'cancelMyPendingRegistrationForTournament',
    { tournamentId },
    member.cookie,
  )
  assert.equal((await participation()).available.length, 1)
  report('Cancelled checkout frees a full team immediately')
  await action(
    'joinTeamAndRegister',
    { tournamentId, teamId, returnPath: route, fieldValues: {} },
    member.cookie,
  )
  await prisma.tournamentRegistration.update({
    where: { tournamentId_userId: { tournamentId, userId: member.user.id } },
    data: { expiresAt: new Date(Date.now() - 60_000) },
  })
  const expiredState = await fetch(
    new URL(`/api/tournaments/${tournamentId}/registration-state`, origin),
    { headers: { cookie: member.cookie } },
  )
  assert.equal(expiredState.status, 200)
  assert.equal(await expiredState.json(), null)
  assert.equal((await participation()).available.length, 1)
  report(
    'API expiry cleanup succeeds in a Route Handler and immediately releases the team place',
  )
  await action(
    'joinTeamAndRegister',
    { tournamentId, teamId, returnPath: route, fieldValues: {} },
    member.cookie,
  )
  await prisma.tournamentRegistration.update({
    where: { tournamentId_userId: { tournamentId, userId: member.user.id } },
    data: { expiresAt: new Date(Date.now() - 60_000) },
  })
  await action('expireMyPendingRegistrations', {}, member.cookie)
  assert.equal((await participation()).available.length, 1)
  report(
    'Profile-entry cleanup succeeds in a Server Action and releases the team place',
  )
  await action(
    'updateProfile',
    { displayName: `${prefix}-new-name` },
    captain.cookie,
  )
  assert(
    (
      await get(`/admin/tournaments/${slug}?tab=registrations`, admin.cookie)
    ).flight.includes(`${prefix}-new-name`),
  )
  report(
    'Identity mutation refreshes embedded participant data in the warmed admin view',
  )

  await action(
    'updateTournamentStatus',
    { id: tournamentId, status: TournamentStatus.ARCHIVED },
    admin.cookie,
  )
  const profile = await get('/profile', captain.cookie)
  assert(profile.flight.includes('ARCHIVED'))
  assert((await get('/tournaments/archive')).flight.includes(slug))
  report(
    'Archiving refreshes player history and the public archive on first read',
  )
} finally {
  if (tournamentId)
    await prisma.tournament.delete({ where: { id: tournamentId } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  await prisma.$disconnect()
}
