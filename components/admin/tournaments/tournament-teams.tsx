/**
 * File: components/admin/tournaments/tournament-teams.tsx
 * Description: Admin teams tab with team cards, member actions, and team dissolution.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  Crown,
  Loader2,
  MoreHorizontal,
  Search,
  Shield,
  Trash2,
  UserMinus,
  UserRound,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { adminPromoteCaptain } from '@/lib/actions/registrations-team'
import { dissolveTeam, kickPlayer } from '@/lib/actions/tournament-team'
import { ROUTES } from '@/lib/config/routes'
import type {
  TeamItem,
  TeamMemberItem,
  TournamentDetail,
} from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/formatting'

// ─── Member Actions ──────────────────────────────────────────────────────────

interface MemberActionsProps {
  tournament: TournamentDetail
  team: TeamItem
  member: TeamMemberItem
}

const MemberActions = ({ tournament, team, member }: MemberActionsProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [promoteOpen, setPromoteOpen] = useState(false)
  const [kickOpen, setKickOpen] = useState(false)

  const isCaptain = team.captain.id === member.user.id
  const displayName = member.user.displayName || member.user.name

  const handlePromote = () => {
    startTransition(async () => {
      const result = await adminPromoteCaptain({
        teamId: team.id,
        userId: member.user.id,
      })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setPromoteOpen(false)
    })
  }

  const handleKick = () => {
    startTransition(async () => {
      const result = await kickPlayer({
        tournamentId: tournament.id,
        teamId: team.id,
        userId: member.user.id,
      })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setKickOpen(false)
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="size-7 p-0"
            aria-label="Actions du membre"
          >
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={ROUTES.ADMIN_USER_DETAIL(member.user.id)}>
              <UserRound className="mr-2 size-4" />
              Voir le joueur
            </Link>
          </DropdownMenuItem>
          {!isCaptain && (
            <DropdownMenuItem onSelect={() => setPromoteOpen(true)}>
              <Crown className="mr-2 size-4" />
              Promouvoir capitaine
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setKickOpen(true)}
            className="text-red-400 focus:text-red-300"
          >
            <UserMinus className="mr-2 size-4" />
            Exclure
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Promote captain confirmation */}
      <AlertDialog open={promoteOpen} onOpenChange={setPromoteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Promouvoir {displayName} capitaine ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {displayName} deviendra le nouveau capitaine de l&apos;équipe{' '}
              {team.name}. L&apos;ancien capitaine restera membre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromote} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Promouvoir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Kick player confirmation */}
      <AlertDialog open={kickOpen} onOpenChange={setKickOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exclure {displayName} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le joueur sera retiré de l&apos;équipe et son inscription sera
              annulée.
              {isCaptain &&
                team.members.length > 1 &&
                ' Le prochain membre sera automatiquement promu capitaine.'}
              {isCaptain &&
                team.members.length === 1 &&
                " L'équipe sera dissoute car il est le dernier membre."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleKick} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Exclure
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Dissolve Team Button ────────────────────────────────────────────────────

interface DissolveTeamButtonProps {
  tournament: TournamentDetail
  team: TeamItem
}

const DissolveTeamButton = ({ tournament, team }: DissolveTeamButtonProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const handleDissolve = () => {
    startTransition(async () => {
      const result = await dissolveTeam({
        tournamentId: tournament.id,
        teamId: team.id,
      })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setOpen(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
        aria-label={`Dissoudre l'équipe ${team.name}`}
      >
        <Trash2 className="size-3.5" />
        <span className="hidden sm:inline">Dissoudre</span>
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Dissoudre l&apos;équipe {team.name} ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Cette action retirera tous les {team.members.length} membre(s) et
            annulera leurs inscriptions. Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleDissolve} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Dissoudre
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Team Card ───────────────────────────────────────────────────────────────

interface TeamCardProps {
  tournament: TournamentDetail
  team: TeamItem
}

const TeamCard = ({ tournament, team }: TeamCardProps) => {
  const memberCount = team.members.length

  return (
    <div className="rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'rounded-lg p-2',
              team.isFull ? 'bg-emerald-500/10' : 'bg-amber-500/10',
            )}
          >
            <Shield
              className={cn(
                'size-4',
                team.isFull ? 'text-emerald-400' : 'text-amber-400',
              )}
            />
          </div>
          <div>
            <h3 className="font-semibold text-white">{team.name}</h3>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>
                {memberCount}/{tournament.teamSize} joueur(s)
              </span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                  team.isFull
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-amber-500/10 text-amber-400',
                )}
              >
                {team.isFull ? 'Complète' : 'Incomplète'}
              </span>
            </div>
          </div>
        </div>
        <DissolveTeamButton tournament={tournament} team={team} />
      </div>

      {/* Members list */}
      <div className="divide-y divide-white/5">
        {team.members.map(member => {
          const displayName = member.user.displayName || member.user.name
          const isCaptain = team.captain.id === member.user.id

          return (
            <div
              key={member.id}
              className="flex items-center justify-between px-5 py-3"
            >
              <div className="flex items-center gap-3">
                {member.user.image ? (
                  <Image
                    src={member.user.image}
                    alt={displayName}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Link
                    href={ROUTES.ADMIN_USER_DETAIL(member.user.id)}
                    className="text-sm font-medium text-zinc-200 transition-colors hover:text-blue-400"
                  >
                    {displayName}
                  </Link>
                  {isCaptain && (
                    <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-400">
                      <Crown className="size-2.5" />
                      Capitaine
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden text-xs text-zinc-600 lg:inline">
                  {formatDate(member.joinedAt)}
                </span>
                <MemberActions
                  tournament={tournament}
                  team={team}
                  member={member}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Card footer */}
      <div className="border-t border-white/5 px-5 py-2.5 text-xs text-zinc-600">
        Créée le {formatDate(team.createdAt)}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface TournamentTeamsProps {
  tournament: TournamentDetail
  teams: TeamItem[]
}

export const TournamentTeams = ({
  tournament,
  teams,
}: TournamentTeamsProps) => {
  const [search, setSearch] = useState('')

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
  }, [])

  const filtered = useMemo(() => {
    if (!search) return teams
    const searchQuery = search.toLowerCase()
    return teams.filter(
      t =>
        t.name.toLowerCase().includes(searchQuery) ||
        t.captain.displayName.toLowerCase().includes(searchQuery) ||
        t.captain.name.toLowerCase().includes(searchQuery) ||
        t.members.some(
          m =>
            m.user.displayName.toLowerCase().includes(searchQuery) ||
            m.user.name.toLowerCase().includes(searchQuery),
        ),
    )
  }, [teams, search])

  const fullCount = teams.filter(t => t.isFull).length
  const incompleteCount = teams.length - fullCount

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/2 px-4 py-2.5 backdrop-blur-sm">
          <Users className="size-4 text-blue-400" />
          <span className="text-sm text-zinc-300">
            {teams.length} équipe(s)
          </span>
        </div>
        {fullCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/2 px-4 py-2.5 backdrop-blur-sm">
            <span className="size-2 rounded-full bg-emerald-400" />
            <span className="text-sm text-zinc-300">
              {fullCount} complète(s)
            </span>
          </div>
        )}
        {incompleteCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/2 px-4 py-2.5 backdrop-blur-sm">
            <span className="size-2 rounded-full bg-amber-400" />
            <span className="text-sm text-zinc-300">
              {incompleteCount} incomplète(s)
            </span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Rechercher une équipe ou un joueur..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="pl-9"
          aria-label="Rechercher une équipe"
        />
      </div>

      {/* Count */}
      <p className="text-xs text-zinc-500">
        {filtered.length} équipe(s)
        {filtered.length !== teams.length && ` sur ${teams.length}`}
      </p>

      {/* Team cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-8 text-center backdrop-blur-sm">
          <p className="text-sm text-zinc-500">Aucune équipe trouvée.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map(team => (
            <TeamCard key={team.id} tournament={tournament} team={team} />
          ))}
        </div>
      )}
    </div>
  )
}
