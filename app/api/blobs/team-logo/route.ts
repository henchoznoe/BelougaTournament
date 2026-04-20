/**
 * File: app/api/blobs/team-logo/route.ts
 * Description: API route for team logo upload (authenticated captain only).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { del, put } from '@vercel/blob'
import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { CACHE_TAGS, MAX_TEAM_LOGO_SIZE } from '@/lib/config/constants'
import auth from '@/lib/core/auth'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import { verifyImageMagicBytes } from '@/lib/utils/image-magic'
import { TournamentStatus } from '@/prisma/generated/prisma/enums'

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

/** POST — Upload a team logo. Expects FormData with "file" and "teamId" fields. */
export const POST = async (request: Request) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const teamId = formData.get('teamId')

    if (!teamId || typeof teamId !== 'string') {
      return NextResponse.json(
        { error: "ID d'équipe manquant." },
        { status: 400 },
      )
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni.' },
        { status: 400 },
      )
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Format non supporté. Utilisez PNG, JPEG ou WebP.' },
        { status: 400 },
      )
    }

    if (file.size > MAX_TEAM_LOGO_SIZE) {
      return NextResponse.json(
        { error: 'Le fichier dépasse la taille maximale de 2 Mo.' },
        { status: 400 },
      )
    }

    // Guard against spoofed Content-Type: validate magic bytes match the
    // declared image format so an HTML/JS payload cannot masquerade as a PNG.
    if (!(await verifyImageMagicBytes(file, file.type))) {
      return NextResponse.json(
        { error: 'Le fichier ne correspond pas à un format image valide.' },
        { status: 400 },
      )
    }

    // Verify team exists, user is captain, tournament is published and teamLogoEnabled
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        captainId: true,
        logoUrl: true,
        tournament: {
          select: {
            slug: true,
            status: true,
            teamLogoEnabled: true,
          },
        },
      },
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Équipe introuvable.' },
        { status: 404 },
      )
    }

    if (team.captainId !== session.user.id) {
      return NextResponse.json(
        { error: "Seul le capitaine peut modifier le logo de l'équipe." },
        { status: 403 },
      )
    }

    if (team.tournament.status !== TournamentStatus.PUBLISHED) {
      return NextResponse.json(
        { error: 'Ce tournoi ne permet plus de modifications.' },
        { status: 400 },
      )
    }

    if (!team.tournament.teamLogoEnabled) {
      return NextResponse.json(
        { error: "Les logos d'équipe ne sont pas activés pour ce tournoi." },
        { status: 400 },
      )
    }

    // Sanitize filename
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const sanitizedName = `${teamId}.${ext}`
    const pathname = `tournaments/${team.tournament.slug}/team-logos/${sanitizedName}`

    // Delete previous logo if it exists
    if (team.logoUrl) {
      try {
        await del(team.logoUrl)
      } catch (error) {
        logger.error({ error }, 'Error deleting previous team logo')
      }
    }

    // Upload new logo
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: true,
    })

    // Update team record
    await prisma.team.update({
      where: { id: teamId },
      data: { logoUrl: blob.url },
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    logger.error({ error }, 'Error uploading team logo')
    return NextResponse.json(
      { error: "Erreur lors de l'upload du logo." },
      { status: 500 },
    )
  }
}

/** Zod schema for the DELETE request body. */
const deleteBodySchema = z.object({
  teamId: z.uuid("ID d'\u00e9quipe invalide."),
})

/** DELETE — Remove a team logo. Expects JSON body with { teamId: string }. */
export const DELETE = async (request: Request) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = deleteBodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "ID d'\u00e9quipe manquant." },
        { status: 400 },
      )
    }

    const { teamId } = parsed.data

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        captainId: true,
        logoUrl: true,
        tournament: {
          select: { status: true, teamLogoEnabled: true },
        },
      },
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Équipe introuvable.' },
        { status: 404 },
      )
    }

    if (team.captainId !== session.user.id) {
      return NextResponse.json(
        { error: "Seul le capitaine peut supprimer le logo de l'équipe." },
        { status: 403 },
      )
    }

    // Mirror the POST-side rules: once a tournament is no longer published or
    // has team logos disabled, captains must go through an admin flow to
    // remove the logo — the public endpoint does not accept mutations.
    if (team.tournament.status !== TournamentStatus.PUBLISHED) {
      return NextResponse.json(
        { error: 'Ce tournoi ne permet plus de modifications.' },
        { status: 400 },
      )
    }

    if (!team.tournament.teamLogoEnabled) {
      return NextResponse.json(
        { error: "Les logos d'équipe ne sont pas activés pour ce tournoi." },
        { status: 400 },
      )
    }

    if (!team.logoUrl) {
      return NextResponse.json(
        { error: 'Aucun logo à supprimer.' },
        { status: 400 },
      )
    }

    await del(team.logoUrl)
    await prisma.team.update({
      where: { id: teamId },
      data: { logoUrl: null },
    })

    revalidateTag(CACHE_TAGS.TOURNAMENTS, 'hours')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Error deleting team logo')
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du logo.' },
      { status: 500 },
    )
  }
}
