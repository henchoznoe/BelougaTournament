/**
 * File: components/features/admin/tournament-overview.tsx
 * Description: Overview tab for a tournament showing status, stats, registration window and quick actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  Archive,
  Calendar,
  ExternalLink,
  Gamepad2,
  Loader2,
  Pencil,
  Send,
  Trophy,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { TournamentStatusBadge } from '@/components/features/admin/tournament-status-badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { updateTournamentStatus } from '@/lib/actions/tournaments'
import { ROUTES } from '@/lib/config/routes'
import type { TournamentDetail } from '@/lib/types/tournament'
import { formatDateTime } from '@/lib/utils/formatting'
import {
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

interface TournamentOverviewProps {
  tournament: TournamentDetail
}

/** Determines the registration window status. */
const getRegistrationStatus = (tournament: TournamentDetail) => {
  const now = new Date()
  const open = new Date(tournament.registrationOpen)
  const close = new Date(tournament.registrationClose)

  if (now < open) {
    return {
      label: 'Pas encore ouvertes',
      style: 'text-amber-400 bg-amber-500/10',
    }
  }
  if (now >= open && now <= close) {
    return { label: 'Ouvertes', style: 'text-emerald-400 bg-emerald-500/10' }
  }
  return { label: 'Fermées', style: 'text-red-400 bg-red-500/10' }
}

/** Builds available status transitions. */
const getStatusTransitions = (current: TournamentStatus) => {
  const transitions: {
    status: TournamentStatus
    label: string
    description: string
    icon: typeof Send
    color: string
  }[] = []

  if (current !== TournamentStatus.PUBLISHED) {
    transitions.push({
      status: TournamentStatus.PUBLISHED,
      label: 'Publier',
      description:
        'Le tournoi sera visible publiquement et les inscriptions seront possibles.',
      icon: Send,
      color: 'bg-emerald-600 text-white hover:bg-emerald-500',
    })
  }
  if (current !== TournamentStatus.DRAFT) {
    transitions.push({
      status: TournamentStatus.DRAFT,
      label: 'Brouillon',
      description: 'Le tournoi ne sera plus visible publiquement.',
      icon: Pencil,
      color: 'bg-amber-600 text-white hover:bg-amber-500',
    })
  }
  if (current !== TournamentStatus.ARCHIVED) {
    transitions.push({
      status: TournamentStatus.ARCHIVED,
      label: 'Archiver',
      description:
        'Le tournoi sera archivé et visible uniquement dans les archives.',
      icon: Archive,
      color: 'bg-zinc-600 text-white hover:bg-zinc-500',
    })
  }

  return transitions
}

export const TournamentOverview = ({ tournament }: TournamentOverviewProps) => {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const registrationStatus = getRegistrationStatus(tournament)
  const statusTransitions = getStatusTransitions(tournament.status)
  const isSolo = tournament.format === TournamentFormat.SOLO
  const registrationCount = tournament._count.registrations
  const teamCount = tournament._count.teams
  const now = new Date()
  const hasStarted = now >= new Date(tournament.startDate)
  const hasEnded = now >= new Date(tournament.endDate)

  const handleStatusChange = (newStatus: TournamentStatus) => {
    startTransition(async () => {
      const result = await updateTournamentStatus({
        id: tournament.id,
        status: newStatus,
      })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Status & actions */}
      <div className="rounded-2xl border border-white/5 bg-white/2 p-5 backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-400">
              Statut actuel
            </span>
            <TournamentStatusBadge
              status={tournament.status}
              className="text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {statusTransitions.map(transition => (
              <AlertDialog key={transition.status}>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    disabled={isPending}
                    className={`gap-1.5 ${transition.color}`}
                  >
                    <transition.icon className="size-3.5" />
                    {transition.label}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-white/10 bg-zinc-950">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">
                      {transition.label} le tournoi
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-400">
                      {transition.description}
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
                      className={transition.color}
                      onClick={() => handleStatusChange(transition.status)}
                    >
                      {isPending && <Loader2 className="size-4 animate-spin" />}
                      Confirmer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ))}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Registrations */}
        <div className="rounded-2xl border border-white/5 bg-white/2 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-zinc-500">
            <Users className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Inscriptions
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-white">
            {registrationCount}
            {tournament.maxTeams != null && (
              <span className="text-sm font-normal text-zinc-500">
                {' '}
                / {tournament.maxTeams}
              </span>
            )}
          </p>
          {tournament.maxTeams != null && (
            <div className="mt-2">
              <div className="h-1.5 rounded-full bg-white/5">
                <div
                  className="h-1.5 rounded-full bg-blue-500 transition-all"
                  style={{
                    width: `${Math.min(((isSolo ? registrationCount : teamCount) / tournament.maxTeams) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Teams (only for team format) */}
        {!isSolo && (
          <div className="rounded-2xl border border-white/5 bg-white/2 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-zinc-500">
              <Trophy className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wider">
                Equipes
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              {teamCount}
              {tournament.maxTeams != null && (
                <span className="text-sm font-normal text-zinc-500">
                  {' '}
                  / {tournament.maxTeams}
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {tournament.teamSize} joueurs par équipe
            </p>
          </div>
        )}

        {/* Game */}
        <div className="rounded-2xl border border-white/5 bg-white/2 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-zinc-500">
            <Gamepad2 className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Jeu
            </span>
          </div>
          <p className="mt-2 text-lg font-semibold text-white">
            {tournament.game || '—'}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {isSolo ? 'Solo' : `Equipe (${tournament.teamSize})`}
          </p>
        </div>

        {/* Tournament status */}
        <div className="rounded-2xl border border-white/5 bg-white/2 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-zinc-500">
            <Calendar className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Tournoi
            </span>
          </div>
          <p className="mt-2 text-lg font-semibold text-white">
            {hasEnded ? 'Terminé' : hasStarted ? 'En cours' : 'A venir'}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {formatDateTime(tournament.startDate)}
          </p>
        </div>
      </div>

      {/* Dates detail */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Tournament dates */}
        <div className="rounded-2xl border border-white/5 bg-white/2 p-5 backdrop-blur-sm">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Dates du tournoi
          </h3>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Début</span>
              <span className="text-zinc-200">
                {formatDateTime(tournament.startDate)}
              </span>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Fin</span>
              <span className="text-zinc-200">
                {formatDateTime(tournament.endDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Registration window */}
        <div className="rounded-2xl border border-white/5 bg-white/2 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Inscriptions
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${registrationStatus.style}`}
            >
              {registrationStatus.label}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Ouverture</span>
              <span className="text-zinc-200">
                {formatDateTime(tournament.registrationOpen)}
              </span>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Fermeture</span>
              <span className="text-zinc-200">
                {formatDateTime(tournament.registrationClose)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="gap-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
        >
          <Link href={ROUTES.ADMIN_TOURNAMENT_EDIT(tournament.slug)}>
            <Pencil className="size-3.5" />
            Modifier le tournoi
          </Link>
        </Button>
        {tournament.status !== TournamentStatus.DRAFT && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-2 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            <Link
              href={`${ROUTES.TOURNAMENTS}/${tournament.slug}`}
              target="_blank"
            >
              <ExternalLink className="size-3.5" />
              Voir la page publique
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
