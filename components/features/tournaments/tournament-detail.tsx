/**
 * File: components/features/tournaments/tournament-detail.tsx
 * Description: Client component displaying full tournament detail (info, rules, prizes, dates).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  Calendar,
  Clock,
  ExternalLink,
  Gamepad2,
  ScrollText,
  Swords,
  Trophy,
  Users,
  Video,
} from 'lucide-react'
import Link from 'next/link'
import { TournamentRegistrationForm } from '@/components/features/tournaments/tournament-registration-form'
import { ROUTES } from '@/lib/config/routes'
import type { PublicTournamentDetail } from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import { formatDate, formatDateTime } from '@/lib/utils/formatting'

interface TournamentDetailProps {
  tournament: PublicTournamentDetail
}

/** Determines the registration status label and color. */
const getRegistrationStatus = (tournament: PublicTournamentDetail) => {
  const now = new Date()
  const open = new Date(tournament.registrationOpen)
  const close = new Date(tournament.registrationClose)

  if (tournament.status === 'ARCHIVED') {
    return {
      label: 'Tournoi terminé',
      className: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400',
    }
  }
  if (now < open) {
    return {
      label: 'Inscriptions bientôt ouvertes',
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    }
  }
  if (now >= open && now <= close) {
    return {
      label: 'Inscriptions ouvertes',
      className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    }
  }
  return {
    label: 'Inscriptions fermées',
    className: 'border-red-500/30 bg-red-500/10 text-red-400',
  }
}

/** Checks if registration is currently open. */
const isRegistrationOpen = (tournament: PublicTournamentDetail) => {
  if (tournament.status === 'ARCHIVED') return false
  const now = new Date()
  const open = new Date(tournament.registrationOpen)
  const close = new Date(tournament.registrationClose)
  return now >= open && now <= close
}

export const TournamentDetail = ({ tournament }: TournamentDetailProps) => {
  const registrationStatus = getRegistrationStatus(tournament)
  const registrationOpen = isRegistrationOpen(tournament)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href={ROUTES.TOURNAMENTS}
        className="group inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors duration-300 hover:text-white"
      >
        <span className="transition-transform duration-300 group-hover:-translate-x-0.5">
          &larr;
        </span>
        Retour aux tournois
      </Link>

      {/* Card 1: Main info */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="relative z-10 space-y-6">
          {/* Title + status */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="font-paladins text-2xl tracking-wider text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
              {tournament.title}
            </h2>
            <span
              className={cn(
                'shrink-0 self-start rounded-full border px-3 py-1 text-xs font-semibold',
                registrationStatus.className,
              )}
            >
              {registrationStatus.label}
            </span>
          </div>

          {/* Description */}
          {tournament.description && (
            <p className="text-sm leading-relaxed text-zinc-400">
              {tournament.description}
            </p>
          )}

          {/* Info grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Game */}
            {tournament.game && (
              <InfoRow icon={Gamepad2} label="Jeu" value={tournament.game} />
            )}

            {/* Format */}
            <InfoRow
              icon={Swords}
              label="Format"
              value={
                tournament.format === 'SOLO'
                  ? 'Solo'
                  : `Équipe de ${tournament.teamSize}`
              }
            />

            {/* Spots */}
            <InfoRow
              icon={Users}
              label="Inscrits"
              value={
                tournament.maxTeams
                  ? `${tournament._count.registrations} / ${tournament.maxTeams}`
                  : `${tournament._count.registrations}`
              }
            />

            {/* Teams (only for TEAM format) */}
            {tournament.format === 'TEAM' && (
              <InfoRow
                icon={Trophy}
                label="Équipes"
                value={`${tournament._count.teams}`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Card 2: Dates */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="relative z-10 space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
            <Calendar className="size-4 text-blue-400" />
            Dates
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <DateRow
              label="Début du tournoi"
              value={formatDateTime(tournament.startDate)}
            />
            <DateRow
              label="Fin du tournoi"
              value={formatDateTime(tournament.endDate)}
            />
            <DateRow
              label="Ouverture des inscriptions"
              value={formatDateTime(tournament.registrationOpen)}
            />
            <DateRow
              label="Fermeture des inscriptions"
              value={formatDateTime(tournament.registrationClose)}
            />
          </div>
        </div>
      </div>

      {/* Card 3: Rules (if present) */}
      {tournament.rules && (
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />

          <div className="relative z-10 space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
              <ScrollText className="size-4 text-blue-400" />
              Règlement
            </h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-400">
              {tournament.rules}
            </p>
          </div>
        </div>
      )}

      {/* Card 4: Prize (if present) */}
      {tournament.prize && (
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />

          <div className="relative z-10 space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
              <Trophy className="size-4 text-blue-400" />
              Récompenses
            </h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-400">
              {tournament.prize}
            </p>
          </div>
        </div>
      )}

      {/* Card 5: External links (if present) */}
      {(tournament.toornamentId || tournament.streamUrl) && (
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />

          <div className="relative z-10 space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
              <ExternalLink className="size-4 text-blue-400" />
              Liens
            </h3>
            <div className="flex flex-wrap gap-3">
              {tournament.toornamentId && (
                <a
                  href={`https://www.toornament.com/tournaments/${tournament.toornamentId}/information`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/2 px-4 py-2 text-sm text-zinc-400 transition-all duration-300 hover:border-white/10 hover:bg-white/4 hover:text-white"
                >
                  <Swords className="size-4 transition-colors duration-300 group-hover:text-blue-400" />
                  Toornament
                  <ExternalLink className="size-3 text-zinc-600" />
                </a>
              )}
              {tournament.streamUrl && (
                <a
                  href={tournament.streamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/2 px-4 py-2 text-sm text-zinc-400 transition-all duration-300 hover:border-white/10 hover:bg-white/4 hover:text-white"
                >
                  <Video className="size-4 transition-colors duration-300 group-hover:text-blue-400" />
                  Stream
                  <ExternalLink className="size-3 text-zinc-600" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Card 6: Registration */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="relative z-10 space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
            <Clock className="size-4 text-blue-400" />
            Inscription
          </h3>

          {registrationOpen ? (
            <>
              <p className="text-center text-sm text-zinc-400">
                Les inscriptions sont ouvertes jusqu'au{' '}
                <span className="font-medium text-zinc-300">
                  {formatDate(tournament.registrationClose)}
                </span>
                .
              </p>
              <TournamentRegistrationForm
                tournamentId={tournament.id}
                fields={tournament.fields}
                autoApprove={tournament.autoApprove}
              />
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              {tournament.status === 'ARCHIVED' ? (
                <p className="text-sm text-zinc-500">Ce tournoi est terminé.</p>
              ) : (
                <p className="text-sm text-zinc-500">
                  Les inscriptions ne sont pas ouvertes pour le moment.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface InfoRowProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}

const InfoRow = ({ icon: Icon, label, value }: InfoRowProps) => (
  <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/2 px-4 py-3">
    <Icon className="size-4 shrink-0 text-zinc-500" />
    <div className="flex min-w-0 flex-col">
      <span className="text-[10px] uppercase tracking-wider text-zinc-600">
        {label}
      </span>
      <span className="text-sm text-zinc-300">{value}</span>
    </div>
  </div>
)

interface DateRowProps {
  label: string
  value: string
}

const DateRow = ({ label, value }: DateRowProps) => (
  <div className="rounded-2xl border border-white/5 bg-white/2 px-4 py-3">
    <span className="text-[10px] uppercase tracking-wider text-zinc-600">
      {label}
    </span>
    <p className="text-sm text-zinc-300">{value}</p>
  </div>
)
