/**
 * File: tests/utils/registration-feedback.test.ts
 * Description: Ensures payment copy follows verified server state and read errors remain errors.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchRegistrationState,
  getPaymentReturnFeedback,
  getRegistrationCapacity,
  isPaymentConfirmationPending,
} from '@/lib/utils/registration-feedback'
import {
  PaymentStatus,
  RegistrationStatus,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

const pending = {
  id: 'registration-1',
  status: RegistrationStatus.PENDING,
  paymentStatus: PaymentStatus.PENDING,
  expiresAt: null,
}
afterEach(() => vi.unstubAllGlobals())

describe('verified payment return feedback', () => {
  it('does not confirm a payment from a success URL alone', () =>
    expect(getPaymentReturnFeedback(null, false, false).tone).toBe('info'))
  it('shows no active registration after withdrawal, even with an old success return', () => {
    expect(getPaymentReturnFeedback(null, false, false).title).toBe(
      'Aucune inscription active',
    )
    expect(isPaymentConfirmationPending(null, true)).toBe(false)
  })
  it.each([RegistrationStatus.CANCELLED, RegistrationStatus.EXPIRED])(
    'does not block registration for a %s record retained for payment history',
    status => {
      const state = { ...pending, status, paymentStatus: PaymentStatus.PAID }
      expect(getPaymentReturnFeedback(state, false, false).title).toBe(
        'Aucune inscription active',
      )
      expect(isPaymentConfirmationPending(state, true)).toBe(false)
    },
  )
  it('blocks duplicate submission only while a returned payment is still pending', () => {
    expect(isPaymentConfirmationPending(pending, true)).toBe(true)
    expect(isPaymentConfirmationPending(pending, false)).toBe(false)
    expect(
      isPaymentConfirmationPending(
        { ...pending, paymentStatus: PaymentStatus.PAID },
        true,
      ),
    ).toBe(true)
    expect(
      isPaymentConfirmationPending(
        { ...pending, status: RegistrationStatus.CONFIRMED },
        true,
      ),
    ).toBe(false)
    expect(
      isPaymentConfirmationPending(
        { ...pending, paymentStatus: PaymentStatus.CANCELLED },
        true,
      ),
    ).toBe(false)
  })
  it('keeps pending registrations pending', () =>
    expect(getPaymentReturnFeedback(pending, false, false).title).toContain(
      'en cours',
    ))
  it('confirms a server-confirmed registration', () =>
    expect(
      getPaymentReturnFeedback(
        {
          ...pending,
          status: RegistrationStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
        },
        false,
        false,
      ).tone,
    ).toBe('success'))
  it('does not claim release if cancellation failed', () =>
    expect(getPaymentReturnFeedback(null, true, false).title).toBe(
      'Vérification de l’annulation',
    ))
  it('does not claim release if the record is still active', () =>
    expect(getPaymentReturnFeedback(pending, true, true).title).toBe(
      'Vérification de l’annulation',
    ))
  it('confirms release only after successful cancellation and a fresh empty read', () =>
    expect(getPaymentReturnFeedback(null, true, true).message).toContain(
      'place a été libérée',
    ))
  it('preserves confirmation when a stale cancel URL is opened', () =>
    expect(
      getPaymentReturnFeedback(
        { ...pending, status: RegistrationStatus.CONFIRMED },
        true,
        true,
      ).tone,
    ).toBe('success'))
})

describe('registration state reads', () => {
  it('accepts null only from a successful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('null')))
    await expect(fetchRegistrationState('tournament-1')).resolves.toBeNull()
  })
  it.each([401, 403, 500, 503])(
    'rejects HTTP %s instead of treating it as no registration',
    async status => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response('null', { status })),
      )
      await expect(fetchRegistrationState('tournament-1')).rejects.toThrow(
        'Impossible de vérifier',
      )
    },
  )
  it('rejects an invalid response shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"status":"CONFIRMED"}')),
    )
    await expect(fetchRegistrationState('tournament-1')).rejects.toThrow()
  })
  it('converts a server timestamp and encodes the tournament id', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ ...pending, expiresAt: '2026-11-08T12:00:00.000Z' }),
        ),
      )
    vi.stubGlobal('fetch', fetch)
    const result = await fetchRegistrationState('id/with space')
    expect(result?.expiresAt).toEqual(new Date('2026-11-08T12:00:00.000Z'))
    expect(fetch).toHaveBeenCalledWith(
      '/api/tournaments/id%2Fwith%20space/registration-state',
      { cache: 'no-store' },
    )
  })
})

describe('registration capacity feedback', () => {
  const tournament = {
    format: TournamentFormat.TEAM,
    maxTeams: 2,
    _count: { teams: 2, registrations: 2 },
  }
  it('allows joining an existing team when all team slots are taken', () =>
    expect(getRegistrationCapacity(tournament, 1)).toBe('join-only'))
  it('reports a full tournament when no team can accept a player', () =>
    expect(getRegistrationCapacity(tournament, 0)).toBe('full'))
  it('counts players for solo tournaments', () =>
    expect(
      getRegistrationCapacity(
        { ...tournament, format: TournamentFormat.SOLO },
        1,
      ),
    ).toBe('full'))
  it('supports tournaments with no capacity limit', () =>
    expect(getRegistrationCapacity({ ...tournament, maxTeams: null }, 0)).toBe(
      'available',
    ))
  it('keeps registrations open below capacity', () =>
    expect(
      getRegistrationCapacity(
        { ...tournament, _count: { teams: 1, registrations: 1 } },
        0,
      ),
    ).toBe('available'))
})
