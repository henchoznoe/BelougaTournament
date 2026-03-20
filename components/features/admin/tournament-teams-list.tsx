/**
 * File: components/features/admin/tournament-teams-list.tsx
 * Description: Client component displaying tournament teams with members, registration status, and admin actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Crown, Loader2, Search, Trash2, UserMinus } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { TeamDetailDialog } from '@/components/features/admin/team-detail-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { dissolveTeam, kickPlayer } from '@/lib/actions/tournaments'
import type { TeamItem, TeamMemberItem } from '@/lib/types/tournament'
import { formatDateTime } from '@/lib/utils/formatting'

interface TournamentTeamsListProps {
  teams: TeamItem[]
  tournamentId: string
}

export const TournamentTeamsList = ({
  teams,
  tournamentId,
}: TournamentTeamsListProps) => {
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // State for team detail dialog
  const [selectedTeam, setSelectedTeam] = useState<TeamItem | undefined>()

  // State for kick member dialog
  const [kickingTeam, setKickingTeam] = useState<TeamItem | undefined>()
  const [kickingMember, setKickingMember] = useState<
    (TeamMemberItem & { teamId: string }) | undefined
  >()

  // State for dissolve team dialog
  const [dissolvingTeam, setDissolvingTeam] = useState<TeamItem | undefined>()

  const filtered = useMemo(() => {
    if (!search) return teams
    const q = search.toLowerCase()
    return teams.filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        t.captain.name.toLowerCase().includes(q) ||
        t.captain.displayName.toLowerCase().includes(q) ||
        t.members.some(
          m =>
            m.user.name.toLowerCase().includes(q) ||
            m.user.displayName.toLowerCase().includes(q),
        ),
    )
  }, [teams, search])

  const fullCount = teams.filter(t => t.isFull).length

  const handleKick = () => {
    if (!kickingMember) return
    startTransition(async () => {
      const result = await kickPlayer({
        tournamentId,
        teamId: kickingMember.teamId,
        userId: kickingMember.user.id,
      })
      if (result.success) {
        toast.success(result.message)
        setKickingMember(undefined)
        setKickingTeam(undefined)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  const handleDissolve = () => {
    if (!dissolvingTeam) return
    startTransition(async () => {
      const result = await dissolveTeam({
        tournamentId,
        teamId: dissolvingTeam.id,
      })
      if (result.success) {
        toast.success(result.message)
        setDissolvingTeam(undefined)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <>
      {/* Search + stats */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Rechercher une équipe..."
            aria-label="Rechercher une équipe"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-white/10 bg-white/5 pl-9 text-zinc-200 placeholder:text-zinc-600"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>
            {teams.length} équipe{teams.length !== 1 ? 's' : ''}
          </span>
          {fullCount > 0 && (
            <span className="text-emerald-400">
              {fullCount} complète{fullCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Teams table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-8 text-center backdrop-blur-sm">
          <p className="text-sm text-zinc-500">
            {search
              ? 'Aucune équipe trouvée pour cette recherche.'
              : 'Aucune équipe pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Equipe
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                  Membres
                </TableHead>
                <TableHead className="hidden text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                  Créée le
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(team => (
                <TableRow
                  key={team.id}
                  tabIndex={0}
                  role="button"
                  className="cursor-pointer border-white/5 hover:bg-white/4"
                  onClick={() => setSelectedTeam(team)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedTeam(team)
                    }
                  }}
                >
                  {/* Team name + captain */}
                  <TableCell>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {team.name}
                        </p>
                        {team.isFull ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                            Complète
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                            Incomplète
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <Crown className="size-3 text-amber-400" />
                        <span className="text-xs text-zinc-500">
                          {team.captain.displayName}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Members */}
                  <TableCell className="hidden sm:table-cell">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex -space-x-2">
                            {team.members.slice(0, 5).map(member => (
                              <div
                                key={member.id}
                                className="relative flex size-7 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-900 bg-white/5"
                              >
                                {member.user.image ? (
                                  <Image
                                    src={member.user.image}
                                    alt={member.user.name}
                                    width={28}
                                    height={28}
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[10px] font-medium text-zinc-400">
                                    {member.user.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            ))}
                            {team.members.length > 5 && (
                              <div className="flex size-7 items-center justify-center rounded-full border-2 border-zinc-900 bg-white/10">
                                <span className="text-[10px] font-medium text-zinc-400">
                                  +{(team.members.length - 5).toString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="max-w-64 border-white/10 bg-zinc-900 text-zinc-300"
                        >
                          <div className="space-y-1 text-xs">
                            {team.members.map(member => (
                              <p key={member.id}>
                                {member.user.displayName}
                                {member.user.id === team.captain.id && (
                                  <span className="ml-1 text-amber-400">
                                    (capitaine)
                                  </span>
                                )}
                              </p>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>

                  {/* Created at */}
                  <TableCell className="hidden text-xs text-zinc-500 md:table-cell">
                    {formatDateTime(team.createdAt)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <fieldset
                      className="flex items-center justify-end gap-1 border-none p-0"
                      onClick={e => e.stopPropagation()}
                      onKeyDown={e => e.stopPropagation()}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setKickingTeam(team)}
                              className="text-zinc-400 hover:text-amber-400"
                              aria-label="Retirer un membre"
                            >
                              <UserMinus className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            className="border-white/10 bg-zinc-900 text-zinc-300"
                          >
                            Retirer un membre
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setDissolvingTeam(team)}
                              className="text-zinc-400 hover:text-red-400"
                              aria-label="Dissoudre l'équipe"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            className="border-white/10 bg-zinc-900 text-zinc-300"
                          >
                            Dissoudre l'équipe
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </fieldset>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Kick member dialog — step 1: select member */}
      {kickingTeam && !kickingMember && (
        <AlertDialog
          open={!!kickingTeam}
          onOpenChange={open => {
            if (!open) setKickingTeam(undefined)
          }}
        >
          <AlertDialogContent className="border-white/10 bg-zinc-950">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                Retirer un membre
              </AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                Sélectionnez le membre à retirer de l'équipe{' '}
                <span className="font-medium text-zinc-200">
                  {kickingTeam.name}
                </span>
                .
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-1">
              {kickingTeam.members.map(member => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() =>
                    setKickingMember({
                      ...member,
                      teamId: kickingTeam.id,
                    })
                  }
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/5"
                >
                  <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                    {member.user.image ? (
                      <Image
                        src={member.user.image}
                        alt={member.user.name}
                        width={32}
                        height={32}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-zinc-400">
                        {member.user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-200">
                      {member.user.displayName}
                    </p>
                  </div>
                  {member.user.id === kickingTeam.captain.id && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                      <Crown className="size-3" />
                      Capitaine
                    </span>
                  )}
                </button>
              ))}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white">
                Annuler
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Kick member dialog — step 2: confirm */}
      {kickingMember && (
        <AlertDialog
          open={!!kickingMember}
          onOpenChange={open => {
            if (!open) {
              setKickingMember(undefined)
              setKickingTeam(undefined)
            }
          }}
        >
          <AlertDialogContent className="border-white/10 bg-zinc-950">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                Confirmer le retrait
              </AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                Êtes-vous sûr de vouloir retirer{' '}
                <span className="font-medium text-zinc-200">
                  {kickingMember.user.displayName}
                </span>{' '}
                de l'équipe{' '}
                <span className="font-medium text-zinc-200">
                  {kickingTeam?.name}
                </span>
                ? Son inscription au tournoi sera également supprimée.
                {kickingTeam &&
                  kickingMember.user.id === kickingTeam.captain.id && (
                    <span className="mt-1 block text-amber-400">
                      Ce joueur est capitaine. Le membre suivant deviendra
                      capitaine automatiquement.
                    </span>
                  )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={isPending}
                className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
              >
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={isPending}
                variant="destructive"
                className="bg-red-500/10 text-red-500 hover:bg-red-500/20"
                onClick={handleKick}
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Retirer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Dissolve team dialog */}
      {dissolvingTeam && (
        <AlertDialog
          open={!!dissolvingTeam}
          onOpenChange={open => {
            if (!open) setDissolvingTeam(undefined)
          }}
        >
          <AlertDialogContent className="border-white/10 bg-zinc-950">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                Dissoudre l'équipe
              </AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                Êtes-vous sûr de vouloir dissoudre l'équipe{' '}
                <span className="font-medium text-zinc-200">
                  {dissolvingTeam.name}
                </span>
                ? Tous les membres ({dissolvingTeam.members.length}) seront
                désinscris du tournoi. Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={isPending}
                className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
              >
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={isPending}
                variant="destructive"
                className="bg-red-500/10 text-red-500 hover:bg-red-500/20"
                onClick={handleDissolve}
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Dissoudre
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Team detail dialog */}
      {selectedTeam && (
        <TeamDetailDialog
          open={!!selectedTeam}
          onOpenChange={open => {
            if (!open) setSelectedTeam(undefined)
          }}
          team={selectedTeam}
          tournamentId={tournamentId}
        />
      )}
    </>
  )
}
