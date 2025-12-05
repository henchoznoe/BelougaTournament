/**
 * File: app/admin/tournaments/page.tsx
 * Description: List of all tournaments with management actions.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

import { Edit, Eye, Plus, Trophy } from 'lucide-react'
import Link from 'next/link'
import { DeleteTournamentButton } from '@/components/admin/delete-tournament-button'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import prisma from '@/lib/prisma'

async function getTournaments() {
  return await prisma.tournament.findMany({
    orderBy: { startDate: 'desc' },
    include: {
      _count: {
        select: { registrations: true },
      },
    },
  })
}

export default async function TournamentsPage() {
  const tournaments = await getTournaments()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
            Tournois
          </h1>
          <p className="text-zinc-400">
            Gérez vos événements compétitifs et vos arbres de tournoi.
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
        >
          <Link href="/admin/tournaments/new">
            <Plus className="mr-2 h-5 w-5" />
            Créer un Tournoi
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl overflow-hidden shadow-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 bg-white/5 hover:bg-white/5">
              <TableHead className="text-zinc-400 font-medium uppercase tracking-wider text-xs py-4 pl-6">
                Titre
              </TableHead>
              <TableHead className="text-zinc-400 font-medium uppercase tracking-wider text-xs py-4">
                Date
              </TableHead>
              <TableHead className="text-zinc-400 font-medium uppercase tracking-wider text-xs py-4">
                Format
              </TableHead>
              <TableHead className="text-zinc-400 font-medium uppercase tracking-wider text-xs py-4">
                Inscrits
              </TableHead>
              <TableHead className="text-right text-zinc-400 font-medium uppercase tracking-wider text-xs py-4 pr-6">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tournaments.length > 0 ? (
              tournaments.map(tournament => (
                <TableRow
                  key={tournament.id}
                  className="border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <TableCell className="font-medium text-white py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                        <Trophy className="size-4" />
                      </div>
                      {tournament.title}
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300 py-4">
                    {new Date(tournament.startDate).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-zinc-300 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {tournament.format}
                    </span>
                  </TableCell>
                  <TableCell className="text-zinc-300 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${Math.min(100, (tournament._count.registrations / (tournament.maxParticipants || 100)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs">
                        {tournament._count.registrations}
                        {tournament.maxParticipants
                          ? ` / ${tournament.maxParticipants}`
                          : ''}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-4 pr-6">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10"
                      >
                        <Link href={`/admin/tournaments/${tournament.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
                      >
                        <Link href={`/admin/tournaments/${tournament.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteTournamentButton id={tournament.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-zinc-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Trophy className="h-8 w-8 text-zinc-700" />
                    <p>Aucun tournoi trouvé.</p>
                    <Button variant="link" asChild className="text-blue-500">
                      <Link href="/admin/tournaments/new">
                        Créer votre premier tournoi
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
