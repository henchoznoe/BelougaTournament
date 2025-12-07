/**
 * File: lib/data/queries/tournaments.ts
 * Description: Database queries for tournament data retrieval.
 */
import prisma from '@/lib/db/prisma'

/**
 * Retrieves and formats tournament registration data for export.
 * Returns a flattened array of objects or null if the tournament is not found.
 */
export async function getTournamentExportData(
  tournamentId: string,
): Promise<Record<string, string>[] | null> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      fields: {
        orderBy: { order: 'asc' },
      },
      registrations: {
        include: {
          players: {
            include: {
              data: true,
            },
          },
        },
      },
    },
  })

  if (!tournament) {
    return null
  }

  const fields = tournament.fields

  // Flatten data
  const flattenedData = tournament.registrations.flatMap(reg => {
    return reg.players.map(player => {
      const row: Record<string, string> = {
        'Registration ID': reg.id,
        'Team Name': reg.teamName || '',
        'Contact Email': reg.contactEmail,
        Status: reg.status,
        'Registration Date': reg.createdAt.toISOString(),
        'Player Nickname': player.nickname,
      }

      // Add dynamic fields
      for (const field of fields) {
        const playerData = player.data.find(
          d => d.tournamentFieldId === field.id,
        )
        row[field.label] = playerData ? playerData.value : ''
      }

      return row
    })
  })

  return flattenedData
}
