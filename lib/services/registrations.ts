/**
 * File: lib/services/registrations.ts
 * Description: Services for fetching tournament registration data (detail page and team options).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { CACHE_TAGS } from '@/lib/config/constants'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import type { RegistrationRow, TeamOption } from '@/lib/types/registration'

/** Raw row shape returned by Prisma before post-processing. */
type RawRegistrationRow = Omit<RegistrationRow, 'team' | 'user'> & {
  payments: NonNullable<RegistrationRow['payment']>[]
  user: RegistrationRow['user'] & {
    teamMembers: {
      team: {
        id: string
        name: string
        captainId: string
        isFull: boolean
        tournamentId: string
      }
    }[]
  }
  team: { id: string; name: string } | null
}

/** Fetches a single registration by ID (for the admin registration detail page). */
export const getRegistrationById = async (
  id: string,
): Promise<RegistrationRow | null> => {
  'use cache'
  cacheLife('minutes')
  cacheTag(CACHE_TAGS.REGISTRATIONS)

  try {
    const row = (await prisma.tournamentRegistration.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        status: true,
        paymentStatus: true,
        fieldValues: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            amount: true,
            currency: true,
            paidAt: true,
            refundedAt: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            image: true,
            bannedUntil: true,
            teamMembers: {
              select: {
                team: {
                  select: {
                    id: true,
                    name: true,
                    captainId: true,
                    isFull: true,
                    tournamentId: true,
                  },
                },
              },
            },
          },
        },
        tournament: {
          select: {
            id: true,
            title: true,
            slug: true,
            format: true,
            status: true,
            fields: {
              select: {
                label: true,
                type: true,
                required: true,
                order: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })) as unknown as RawRegistrationRow | null

    if (!row) return null

    // Post-process: resolve team from TeamMember
    const membership = row.user.teamMembers.find(
      tm => tm.team.tournamentId === row.tournament.id,
    )

    const team = membership
      ? {
          id: membership.team.id,
          name: membership.team.name,
          captainId: membership.team.captainId,
          isFull: membership.team.isFull,
        }
      : null

    const { teamMembers: _, ...user } = row.user

    return { ...row, user, team, payment: row.payments[0] ?? null }
  } catch (error) {
    logger.error({ error }, 'Error fetching registration by ID')
    return null
  }
}

/** Fetches lightweight team options for all TEAM-format tournaments present in the registrations. */
export const getTeamOptions = async (
  tournamentIds: string[],
): Promise<Record<string, TeamOption[]>> => {
  'use cache'
  cacheLife('minutes')
  cacheTag(CACHE_TAGS.TOURNAMENTS)

  if (tournamentIds.length === 0) return {}

  try {
    const teams = await prisma.team.findMany({
      where: { tournamentId: { in: tournamentIds } },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        isFull: true,
        tournamentId: true,
      },
    })

    const result: Record<string, TeamOption[]> = {}
    for (const team of teams) {
      const list = result[team.tournamentId] ?? []
      list.push({ id: team.id, name: team.name, isFull: team.isFull })
      result[team.tournamentId] = list
    }

    return result
  } catch (error) {
    logger.error({ error }, 'Error fetching team options')
    return {}
  }
}
