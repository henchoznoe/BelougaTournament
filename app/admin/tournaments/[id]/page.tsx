/**
 * File: app/admin/tournaments/[id]/page.tsx
 * Description: Tournament manager page for viewing details, managing registrations, and updating settings.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import {
  Calendar,
  Check,
  Edit,
  Eye,
  Swords,
  Trash2,
  Trophy,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CsvExportButton } from '@/components/features/admin/actions/csv-export'
import { VisibilityToggle } from '@/components/features/tournament/actions/visibility-toggle'
import { ChallongeIdForm } from '@/components/features/tournament/form/challonge-id-form'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  deleteRegistration,
  updateRegistrationStatus,
} from '@/lib/actions/registration'
import { APP_ROUTES } from '@/lib/config/routes'
import prisma from '@/lib/core/db'
import { fr } from '@/lib/i18n/dictionaries/fr'
import { formatDate } from '@/lib/utils'

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

export const dynamic = 'force-dynamic'

const getTournament = async (id: string) => {
  return await prisma.tournament.findUnique({
    where: { id },
    include: {
      registrations: {
        orderBy: { createdAt: 'desc' },
        include: {
          players: {
            include: {
              data: true,
            },
          },
        },
      },
      fields: true,
    },
  })
}

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const TournamentManagerPage = async ({
  params,
}: {
  params: Promise<{ id: string }>
}) => {
  const { id } = await params
  const tournament = await getTournament(id)

  if (!tournament) {
    notFound()
  }

  const validRegistrationsCount = tournament.registrations.filter(
    r => r.status === 'APPROVED' || r.status === 'PENDING',
  ).length

  const fillRate = tournament.maxParticipants
    ? Math.round((validRegistrationsCount / tournament.maxParticipants) * 100)
    : 0

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Trophy className="size-6 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white">
              {tournament.title}
            </h1>
          </div>
          <p className="text-zinc-400 max-w-2xl">
            {fr.pages.admin.tournaments.detail.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <VisibilityToggle
            tournamentId={tournament.id}
            currentVisibility={tournament.visibility}
          />
          <Button
            asChild
            variant="outline"
            className="h-12 border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 hover:text-blue-400 text-zinc-300"
          >
            <Link
              href={`${APP_ROUTES.ADMIN_TOURNAMENTS}/${tournament.id}/edit`}
            >
              <Edit className="mr-2 h-4 w-4" />
              {fr.pages.admin.tournaments.detail.buttons.edit}
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-zinc-900/50 border border-white/10 p-1 h-auto backdrop-blur-xl">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white py-2 px-4 text-zinc-400"
          >
            {fr.pages.admin.tournaments.detail.tabs.overview}
          </TabsTrigger>
          <TabsTrigger
            value="registrants"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white py-2 px-4 text-zinc-400"
          >
            {fr.pages.admin.tournaments.detail.tabs.registrants(
              tournament.registrations.length,
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  {fr.pages.admin.tournaments.detail.cards.fillRate.title}
                </CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{fillRate}%</div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, fillRate)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  {validRegistrationsCount} /{' '}
                  {tournament.maxParticipants || '∞'}{' '}
                  {
                    fr.pages.admin.tournaments.detail.cards.fillRate
                      .participants
                  }
                </p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  {fr.pages.admin.tournaments.detail.cards.format.title}
                </CardTitle>
                <Swords className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {tournament.format}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {fr.pages.admin.tournaments.detail.cards.format.subtitle}
                </p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  {fr.pages.admin.tournaments.detail.cards.date.title}
                </CardTitle>
                <Calendar className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatDate(tournament.startDate)}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {fr.pages.admin.tournaments.detail.cards.date.subtitle}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-white">
                {fr.pages.admin.tournaments.detail.cards.challonge.title}
              </CardTitle>
              <CardDescription className="text-zinc-400">
                {fr.pages.admin.tournaments.detail.cards.challonge.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChallongeIdForm
                tournamentId={tournament.id}
                initialChallongeId={tournament.challongeId}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registrants" className="space-y-6">
          <div className="flex justify-end">
            <CsvExportButton tournamentId={tournament.id} />
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl overflow-hidden shadow-xl">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 bg-white/5 hover:bg-white/5">
                  <TableHead className="text-zinc-400 font-medium uppercase tracking-wider text-xs py-4 pl-6">
                    {fr.pages.admin.tournaments.detail.table.name}
                  </TableHead>
                  <TableHead className="text-zinc-400 font-medium uppercase tracking-wider text-xs py-4">
                    {fr.pages.admin.tournaments.detail.table.contact}
                  </TableHead>
                  <TableHead className="text-zinc-400 font-medium uppercase tracking-wider text-xs py-4">
                    {fr.pages.admin.tournaments.detail.table.status}
                  </TableHead>
                  <TableHead className="text-zinc-400 font-medium uppercase tracking-wider text-xs py-4">
                    {fr.pages.admin.tournaments.detail.table.date}
                  </TableHead>
                  <TableHead className="text-right text-zinc-400 font-medium uppercase tracking-wider text-xs py-4 pr-6">
                    {fr.pages.admin.tournaments.detail.table.actions}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournament.registrations.length > 0 ? (
                  tournament.registrations.map(reg => (
                    <TableRow
                      key={reg.id}
                      className="border-white/5 hover:bg-white/5 transition-colors group"
                    >
                      <TableCell className="font-medium text-white py-4 pl-6">
                        {reg.teamName ||
                          reg.players[0]?.nickname ||
                          fr.pages.admin.tournaments.detail.sheet.unknownTeam}
                        {reg.players.length > 1 && (
                          <span className="ml-2 text-xs text-zinc-500">
                            {fr.pages.admin.tournaments.detail.sheet.playersCount(
                              reg.players.length,
                            )}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-300 py-4">
                        {reg.contactEmail}
                      </TableCell>
                      <TableCell className="text-zinc-300 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            reg.status === 'APPROVED'
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : reg.status === 'PENDING'
                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {reg.status === 'APPROVED'
                            ? fr.pages.admin.tournaments.detail.table
                                .statusLabels.approved
                            : reg.status === 'PENDING'
                              ? fr.pages.admin.tournaments.detail.table
                                  .statusLabels.pending
                              : fr.pages.admin.tournaments.detail.table
                                  .statusLabels.rejected}
                        </span>
                      </TableCell>
                      <TableCell className="text-zinc-300 py-4">
                        {formatDate(reg.createdAt)}
                      </TableCell>
                      <TableCell className="text-right py-4 pr-6">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {reg.status === 'PENDING' && (
                            <>
                              <form
                                action={async () => {
                                  'use server'
                                  await updateRegistrationStatus(
                                    reg.id,
                                    'APPROVED',
                                  )
                                }}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-zinc-400 hover:text-green-400 hover:bg-green-500/10"
                                  title={
                                    fr.pages.admin.tournaments.detail.buttons
                                      .approve
                                  }
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              </form>

                              <form
                                action={async () => {
                                  'use server'
                                  await updateRegistrationStatus(
                                    reg.id,
                                    'REJECTED',
                                  )
                                }}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                                  title={
                                    fr.pages.admin.tournaments.detail.buttons
                                      .reject
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </form>
                            </>
                          )}

                          <Sheet>
                            <SheetTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="overflow-y-auto bg-zinc-950 border-white/10 text-zinc-50 sm:max-w-xl">
                              <SheetHeader>
                                <SheetTitle className="text-2xl font-bold text-white">
                                  {
                                    fr.pages.admin.tournaments.detail.sheet
                                      .title
                                  }
                                </SheetTitle>
                                <SheetDescription>
                                  {reg.teamName || 'Détails du joueur'}
                                </SheetDescription>
                              </SheetHeader>
                              <div className="mt-8 space-y-6">
                                {reg.players.map(player => (
                                  <div
                                    key={player.id}
                                    className="rounded-xl border border-white/10 bg-zinc-900/30 p-6"
                                  >
                                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                                      {player.nickname}
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                      {player.data.map(d => {
                                        const fieldLabel =
                                          tournament.fields.find(
                                            f => f.id === d.tournamentFieldId,
                                          )?.label ||
                                          fr.pages.admin.tournaments.detail
                                            .sheet.unknownField
                                        return (
                                          <div
                                            key={d.id}
                                            className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0"
                                          >
                                            <span className="text-zinc-400">
                                              {fieldLabel}
                                            </span>
                                            <span className="text-white font-medium">
                                              {d.value}
                                            </span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </SheetContent>
                          </Sheet>

                          <form
                            action={async () => {
                              'use server'
                              await deleteRegistration(reg.id, tournament.id)
                            }}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
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
                      {fr.pages.admin.tournaments.detail.table.empty}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default TournamentManagerPage
