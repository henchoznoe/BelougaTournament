/**
 * File: app/api/admin/tournaments/[id]/export-csv/route.ts
 * Description: CSV export endpoint for Toornament-compatible tournament registration data.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { NextResponse } from 'next/server'
import auth from '@/lib/core/auth'
import { logger } from '@/lib/core/logger'
import prisma from '@/lib/core/prisma'
import { Role, TournamentFormat } from '@/prisma/generated/prisma/enums'

/** Tournament data needed for CSV export. */
type TournamentExportData = {
  slug: string
  format: TournamentFormat
  fields: { label: string; order: number }[]
}

/** A single registration row with user and team data for CSV export. */
type RegistrationExportRow = {
  status: string
  fieldValues: Record<string, string | number> | null
  user: { name: string; displayName: string; email: string }
  team: { name: string } | null
}

/** Escapes a CSV field value: wraps in quotes if it contains commas, quotes, or newlines. */
const escapeCsvField = (value: string): string => {
  if (
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** Builds a CSV row from an array of field values. */
const buildCsvRow = (fields: string[]): string =>
  fields.map(escapeCsvField).join(',')

/**
 * Verifies that the request comes from an authenticated ADMIN or SUPERADMIN.
 * ADMINs must be assigned to the tournament; SUPERADMINs bypass the assignment check.
 */
const verifyAdminAccess = async (request: Request, tournamentId: string) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return null

  const role = session.user.role as string
  if (role === Role.SUPERADMIN) return session

  if (role === Role.ADMIN) {
    const assignment = await prisma.adminAssignment.findUnique({
      where: {
        adminId_tournamentId: {
          adminId: session.user.id,
          tournamentId,
        },
      },
    })
    if (assignment) return session
  }

  return null
}

/** GET — Export tournament registrations as a Toornament-compatible CSV file. */
export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: tournamentId } = await params

  const session = await verifyAdminAccess(request, tournamentId)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch tournament metadata (slug, format, fields)
    const tournament = (await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    })) as unknown as TournamentExportData | null

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournoi introuvable.' },
        { status: 404 },
      )
    }

    // Fetch all registrations with user + team data
    const registrations = (await prisma.tournamentRegistration.findMany({
      where: { tournamentId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            name: true,
            displayName: true,
            email: true,
          },
        },
        team: {
          select: {
            name: true,
          },
        },
      },
    })) as unknown as RegistrationExportRow[]

    // Build CSV column headers
    const isTeamFormat = tournament.format === TournamentFormat.TEAM
    const fieldLabels = tournament.fields.map(f => f.label)

    const headers: string[] = []
    if (isTeamFormat) headers.push('Equipe')
    headers.push('Pseudo', 'Nom Discord', 'Email', 'Statut')
    for (const label of fieldLabels) {
      headers.push(label)
    }

    // Build CSV rows
    const rows: string[] = [buildCsvRow(headers)]

    for (const reg of registrations) {
      const fieldValues = (reg.fieldValues ?? {}) as Record<
        string,
        string | number
      >

      const row: string[] = []
      if (isTeamFormat) row.push(reg.team?.name ?? '')
      row.push(reg.user.displayName, reg.user.name, reg.user.email, reg.status)

      for (const label of fieldLabels) {
        const value = fieldValues[label]
        row.push(value !== undefined && value !== null ? String(value) : '')
      }

      rows.push(buildCsvRow(row))
    }

    // UTF-8 BOM for Excel compatibility + CSV content
    const BOM = '\uFEFF'
    const csvContent = BOM + rows.join('\r\n')

    const filename = `${tournament.slug}-inscriptions.csv`

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    logger.error(
      { error, tournamentId },
      'Error exporting tournament registrations as CSV',
    )
    return NextResponse.json(
      { error: "Erreur lors de l'export CSV." },
      { status: 500 },
    )
  }
}
