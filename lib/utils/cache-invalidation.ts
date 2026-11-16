/**
 * File: lib/utils/cache-invalidation.ts
 * Description: Centralized cache invalidation groups for tournament and player mutations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { revalidatePath, revalidateTag, updateTag } from 'next/cache'
import { CACHE_TAGS, CACHE_TAGS_DYNAMIC } from '@/lib/config/constants/cache'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'

const unique = (tags: string[]): string[] => [...new Set(tags)]

const getUserCacheTags = (userIds: string[]): string[] =>
  unique(
    userIds.flatMap(id => [
      CACHE_TAGS_DYNAMIC.USER(id),
      CACHE_TAGS_DYNAMIC.USER_REGISTRATIONS(id),
      CACHE_TAGS_DYNAMIC.PLAYER(id),
    ]),
  )

/** Capture before deleting a tournament or its registrations. Includes former players. */
export const getTournamentParticipantIds = async (
  tournamentId: string,
): Promise<string[]> => {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { registrations: { some: { tournamentId } } },
        { teamMembers: { some: { team: { tournamentId } } } },
      ],
    },
    select: { id: true },
  })
  return users.map(user => user.id)
}

export const getTournamentParticipationCacheTags = (
  tournamentId: string,
  userIds: string | string[] = [],
): string[] =>
  unique([
    CACHE_TAGS.TOURNAMENTS,
    CACHE_TAGS.TOURNAMENTS_PUBLISHED,
    CACHE_TAGS.TOURNAMENTS_ARCHIVED,
    CACHE_TAGS.PUBLIC_STATS,
    CACHE_TAGS.PLAYERS_LIST,
    CACHE_TAGS.DASHBOARD_REGISTRATIONS,
    CACHE_TAGS.DASHBOARD_PAYMENTS,
    CACHE_TAGS_DYNAMIC.TOURNAMENT(tournamentId),
    CACHE_TAGS_DYNAMIC.TOURNAMENT_REGISTRANTS(tournamentId),
    CACHE_TAGS_DYNAMIC.TOURNAMENT_TEAMS(tournamentId),
    ...getUserCacheTags(Array.isArray(userIds) ? userIds : [userIds]),
  ])

/** Cache failures must not turn a committed payment/write into a retryable failure. */
const expire = (tags: string[], execute: (tag: string) => void): void => {
  for (const tag of unique(tags)) {
    try {
      execute(tag)
    } catch (error) {
      logger.error(
        { error, tag },
        'Cache expiration failed after committed mutation',
      )
    }
  }
}

export const expireActionTags = (tags: string[]): void =>
  expire(tags, updateTag)
export const expireRequestTags = (tags: string[]): void =>
  expire(tags, tag => revalidateTag(tag, { expire: 0 }))

/** Resolve related users outside cached reads, using the selected request executor. */
export const invalidateTournamentParticipation = async (
  tournamentId: string,
  userIds: string | string[] = [],
  execute = expireActionTags,
): Promise<void> => {
  const ids = Array.isArray(userIds) ? userIds : [userIds]
  execute(getTournamentParticipationCacheTags(tournamentId, ids))
  try {
    execute(getUserCacheTags(await getTournamentParticipantIds(tournamentId)))
  } catch (error) {
    logger.error(
      { error, tournamentId },
      'Failed to collect related cache dependencies',
    )
  }
}

export const invalidateTournamentCatalog = async (options?: {
  tournamentId?: string
  slug?: string
  userIds?: string[]
}): Promise<void> => {
  expireActionTags([
    CACHE_TAGS.TOURNAMENTS,
    CACHE_TAGS.TOURNAMENTS_PUBLISHED,
    CACHE_TAGS.TOURNAMENTS_ARCHIVED,
    CACHE_TAGS.TOURNAMENT_HERO,
    CACHE_TAGS.TOURNAMENTS_SITEMAP,
    CACHE_TAGS.PUBLIC_STATS,
    CACHE_TAGS.PLAYERS_LIST,
    CACHE_TAGS.DASHBOARD_STATS,
    CACHE_TAGS.DASHBOARD_REGISTRATIONS,
    CACHE_TAGS.DASHBOARD_PAYMENTS,
    ...getUserCacheTags(options?.userIds ?? []),
    ...(options?.slug
      ? [CACHE_TAGS_DYNAMIC.TOURNAMENT_SLUG(options.slug)]
      : []),
  ])
  if (options?.tournamentId) {
    await invalidateTournamentParticipation(
      options.tournamentId,
      options.userIds,
    )
  }
  for (const path of [
    '/',
    '/tournaments',
    '/tournaments/archive',
    '/sitemap.xml',
    ...(options?.slug
      ? [`/tournaments/${options.slug}`, `/admin/tournaments/${options.slug}`]
      : []),
  ]) {
    try {
      revalidatePath(path)
    } catch (error) {
      logger.error({ error, path }, 'Cache path expiration failed')
    }
  }
}

/** Capture identity dependencies before deleting the user. */
export const getUserTournamentIds = async (
  userId: string,
): Promise<string[]> => {
  const tournaments = await prisma.tournament.findMany({
    where: {
      OR: [
        { registrations: { some: { userId } } },
        { teams: { some: { members: { some: { userId } } } } },
      ],
    },
    select: { id: true },
  })
  return tournaments.map(tournament => tournament.id)
}

/** Identity is embedded in participants, teams and recent activity, including archives. */
export const invalidatePlayer = async (
  userId: string,
  execute = expireActionTags,
): Promise<void> => {
  execute([
    CACHE_TAGS.USERS,
    CACHE_TAGS.PLAYERS,
    CACHE_TAGS.PLAYERS_LIST,
    CACHE_TAGS.PUBLIC_STATS,
    CACHE_TAGS.DASHBOARD_STATS,
    CACHE_TAGS.DASHBOARD_RECENT_USERS,
    CACHE_TAGS.DASHBOARD_REGISTRATIONS,
    ...getUserCacheTags([userId]),
  ])
  try {
    const tournamentIds = await getUserTournamentIds(userId)
    for (const tournamentId of tournamentIds) {
      execute([
        CACHE_TAGS_DYNAMIC.TOURNAMENT_REGISTRANTS(tournamentId),
        CACHE_TAGS_DYNAMIC.TOURNAMENT_TEAMS(tournamentId),
      ])
    }
  } catch (error) {
    logger.error(
      { error, userId },
      'Failed to collect identity cache dependencies',
    )
  }
}
