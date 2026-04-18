/**
 * File: components/admin/detail/tournament-detail.tsx
 * Description: Tournament overview with status badge, action buttons, info cards, stats, and markdown preview.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  AlertTriangle,
  Calendar,
  CalendarCheck,
  CalendarX,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  Gamepad2,
  Hash,
  Info,
  Layers,
  Loader2,
  Pencil,
  RefreshCw,
  Settings,
  Shield,
  Swords,
  Trash2,
  Trophy,
  Users,
  Video,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Markdown } from '@/components/ui/markdown'
import {
  deleteTournament,
  updateTournamentStatus,
} from '@/lib/actions/tournaments'
import {
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_STATUS_STYLES,
} from '@/lib/config/constants'
import { ROUTES } from '@/lib/config/routes'
import type { TournamentDetail as TournamentDetailType } from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import { formatDate, formatDateTime } from '@/lib/utils/formatting'
import {
  RefundPolicyType,
  RegistrationType,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

// ─── Constants ───────────────────────────────────────────────────────────────

const FORMAT_LABELS: Record<TournamentFormat, string> = {
  [TournamentFormat.SOLO]: 'Solo',
  [TournamentFormat.TEAM]: '\u00c9quipe',
} as const

const REGISTRATION_TYPE_LABELS: Record<RegistrationType, string> = {
  [RegistrationType.FREE]: 'Gratuit',
  [RegistrationType.PAID]: 'Payant',
} as const

const REFUND_POLICY_LABELS: Record<RefundPolicyType, string> = {
  [RefundPolicyType.NONE]: 'Aucun remboursement',
  [RefundPolicyType.BEFORE_DEADLINE]: 'Avant d\u00e9lai',
} as const

/** Allowed status transitions for the status badge. */
const STATUS_TRANSITIONS: Record<
  TournamentStatus,
  { label: string; target: TournamentStatus }[]
> = {
  [TournamentStatus.DRAFT]: [
    { label: 'Publier', target: TournamentStatus.PUBLISHED },
  ],
  [TournamentStatus.PUBLISHED]: [
    { label: 'Archiver', target: TournamentStatus.ARCHIVED },
    { label: 'Remettre en brouillon', target: TournamentStatus.DRAFT },
  ],
  [TournamentStatus.ARCHIVED]: [
    { label: 'Remettre en brouillon', target: TournamentStatus.DRAFT },
  ],
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatAmount = (amount: number, currency: string) => {
  return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
}

/** Returns a temporal indicator for a date relative to now. */
const getDateIndicator = (date: Date): { label: string; className: string } => {
  const now = new Date()
  const d = new Date(date)
  if (d < now) return { label: 'Pass\u00e9', className: 'text-zinc-500' }
  // Within 24h
  const diff = d.getTime() - now.getTime()
  if (diff < 24 * 60 * 60 * 1000)
    return { label: 'Bient\u00f4t', className: 'text-amber-400' }
  return { label: '\u00c0 venir', className: 'text-emerald-400' }
}

// ─── Status Badge (clickable with transitions) ──────────────────────────────

interface TournamentStatusBadgeProps {
  tournament: TournamentDetailType
}

export const TournamentStatusBadge = ({
  tournament,
}: TournamentStatusBadgeProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedTransition, setSelectedTransition] = useState<{
    label: string
    target: TournamentStatus
  } | null>(null)

  const transitions = STATUS_TRANSITIONS[tournament.status]
  const hasRegistrations = tournament._count.registrations > 0

  const handleStatusChange = () => {
    if (!selectedTransition) return
    startTransition(async () => {
      const result = await updateTournamentStatus({
        id: tournament.id,
        status: selectedTransition.target,
      })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setConfirmOpen(false)
      setSelectedTransition(null)
    })
  }

  const openConfirm = (transition: {
    label: string
    target: TournamentStatus
  }) => {
    setSelectedTransition(transition)
    setConfirmOpen(true)
  }

  // Warning message when changing status with registrations
  const getWarningMessage = () => {
    if (!selectedTransition) return ''
    if (
      selectedTransition.target === TournamentStatus.DRAFT &&
      hasRegistrations
    ) {
      return ' Attention : ce tournoi a des inscrits. Le remettre en brouillon le rendra invisible au public.'
    }
    if (
      selectedTransition.target === TournamentStatus.ARCHIVED &&
      hasRegistrations
    ) {
      return ' Les inscriptions seront ferm\u00e9es.'
    }
    return ''
  }

  if (transitions.length === 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
          TOURNAMENT_STATUS_STYLES[tournament.status],
        )}
      >
        {TOURNAMENT_STATUS_LABELS[tournament.status]}
      </span>
    )
  }

  if (transitions.length === 1) {
    return (
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            onClick={() => openConfirm(transitions[0])}
            disabled={isPending}
            aria-label={`Changer le statut du tournoi`}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
              'cursor-pointer disabled:cursor-wait disabled:opacity-60',
              TOURNAMENT_STATUS_STYLES[tournament.status],
              'hover:opacity-80',
            )}
          >
            {isPending ? <Loader2 className="size-3 animate-spin" /> : null}
            {TOURNAMENT_STATUS_LABELS[tournament.status]}
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedTransition?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              Passer le tournoi de &laquo;&nbsp;
              {TOURNAMENT_STATUS_LABELS[tournament.status]}&nbsp;&raquo; \u00e0
              &laquo;&nbsp;
              {selectedTransition
                ? TOURNAMENT_STATUS_LABELS[selectedTransition.target]
                : ''}
              &nbsp;&raquo; ?{getWarningMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  // Multiple transitions (PUBLISHED has 2 options)
  return (
    <>
      <div className="flex items-center gap-1">
        {transitions.map(transition => (
          <button
            key={transition.target}
            type="button"
            onClick={() => openConfirm(transition)}
            disabled={isPending}
            aria-label={transition.label}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
              'cursor-pointer disabled:cursor-wait disabled:opacity-60',
              transition === transitions[0]
                ? TOURNAMENT_STATUS_STYLES[tournament.status]
                : 'bg-white/5 text-zinc-400 hover:bg-white/10',
              'hover:opacity-80',
            )}
          >
            {transition === transitions[0] && isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : null}
            {transition === transitions[0]
              ? TOURNAMENT_STATUS_LABELS[tournament.status]
              : transition.label}
          </button>
        ))}
      </div>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedTransition?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              Passer le tournoi de &laquo;&nbsp;
              {TOURNAMENT_STATUS_LABELS[tournament.status]}&nbsp;&raquo; \u00e0
              &laquo;&nbsp;
              {selectedTransition
                ? TOURNAMENT_STATUS_LABELS[selectedTransition.target]
                : ''}
              &nbsp;&raquo; ?{getWarningMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Action Buttons (Edit + Delete) ──────────────────────────────────────────

interface TournamentDetailActionsProps {
  tournament: TournamentDetailType
}

export const TournamentDetailActions = ({
  tournament,
}: TournamentDetailActionsProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const hasRegistrations = tournament._count.registrations > 0

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteTournament({ id: tournament.id })
      if (result.success) {
        toast.success(result.message)
        router.push(ROUTES.ADMIN_TOURNAMENTS)
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={`${ROUTES.ADMIN_TOURNAMENT_DETAIL(tournament.slug)}/edit`}>
          <Pencil className="size-4" />
          Modifier
        </Link>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="size-4" />
            Supprimer
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {tournament.title} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irr\u00e9versible. Le tournoi et toutes ses
              donn\u00e9es associ\u00e9es (inscriptions, \u00e9quipes,
              paiements) seront d\u00e9finitivement supprim\u00e9s.
              {hasRegistrations && (
                <>
                  {' '}
                  <span className="font-semibold text-amber-400">
                    Attention : ce tournoi a {tournament._count.registrations}{' '}
                    inscription(s).
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Stats Summary ───────────────────────────────────────────────────────────

interface StatsSummaryProps {
  tournament: TournamentDetailType
}

const StatsSummary = ({ tournament }: StatsSummaryProps) => {
  const isTeam = tournament.format === TournamentFormat.TEAM
  const maxLabel = tournament.maxTeams ? `/ ${tournament.maxTeams}` : ''
  const isPaid = tournament.registrationType === RegistrationType.PAID

  const STAT_ITEMS = [
    {
      icon: Users,
      label: 'Inscriptions',
      value: `${tournament._count.registrations} ${maxLabel}`,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    ...(isTeam
      ? [
          {
            icon: Swords,
            label: '\u00c9quipes',
            value: `${tournament._count.teams} ${maxLabel}`,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
          },
        ]
      : []),
    {
      icon: CreditCard,
      label: 'Type',
      value:
        isPaid && tournament.entryFeeAmount && tournament.entryFeeCurrency
          ? `${REGISTRATION_TYPE_LABELS[tournament.registrationType]} \u2014 ${formatAmount(tournament.entryFeeAmount, tournament.entryFeeCurrency)}`
          : REGISTRATION_TYPE_LABELS[tournament.registrationType],
      color: isPaid ? 'text-amber-400' : 'text-emerald-400',
      bg: isPaid ? 'bg-amber-500/10' : 'bg-emerald-500/10',
    },
    {
      icon: Trophy,
      label: 'Format',
      value: isTeam
        ? `${FORMAT_LABELS[tournament.format]} (${tournament.teamSize}v${tournament.teamSize})`
        : FORMAT_LABELS[tournament.format],
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STAT_ITEMS.map(item => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/2 p-4 backdrop-blur-sm"
        >
          <div className={cn('rounded-lg p-2', item.bg)}>
            <item.icon className={cn('size-4', item.color)} />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{item.value}</p>
            <p className="text-xs text-zinc-500">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Date Row Helper ─────────────────────────────────────────────────────────

interface DateRowProps {
  icon: typeof Calendar
  label: string
  date: Date
  showIndicator?: boolean
}

const DateRow = ({
  icon: Icon,
  label,
  date,
  showIndicator = true,
}: DateRowProps) => {
  const indicator = getDateIndicator(date)
  return (
    <div className="flex items-start justify-between gap-2">
      <dt className="flex items-center gap-2 text-zinc-500">
        <Icon className="size-3.5" />
        {label}
      </dt>
      <dd className="text-right">
        <span className="text-zinc-300">{formatDateTime(date)}</span>
        {showIndicator && (
          <span
            className={cn(
              'ml-2 text-[10px] font-semibold',
              indicator.className,
            )}
          >
            {indicator.label}
          </span>
        )}
      </dd>
    </div>
  )
}

// ─── Main Overview Component ─────────────────────────────────────────────────

interface TournamentOverviewProps {
  tournament: TournamentDetailType
}

export const TournamentOverview = ({ tournament }: TournamentOverviewProps) => {
  const isTeam = tournament.format === TournamentFormat.TEAM
  const isPaid = tournament.registrationType === RegistrationType.PAID

  const hasCustomFields = tournament.fields.length > 0
  const hasToornamentStages = tournament.toornamentStages.length > 0

  // Compute registration window status
  const registrationStatus = useMemo(() => {
    const now = new Date()
    const open = new Date(tournament.registrationOpen)
    const close = new Date(tournament.registrationClose)
    if (now < open)
      return { label: 'Pas encore ouvertes', className: 'text-zinc-400' }
    if (now >= open && now < close)
      return { label: 'Ouvertes', className: 'text-emerald-400' }
    return { label: 'Ferm\u00e9es', className: 'text-red-400' }
  }, [tournament.registrationOpen, tournament.registrationClose])

  return (
    <div className="space-y-6">
      {/* Stats summary */}
      <StatsSummary tournament={tournament} />

      {/* Info cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Informations card */}
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Info className="size-4 text-blue-400" />
            Informations
          </h2>
          <dl className="space-y-3 text-sm">
            {tournament.game && (
              <div className="flex items-start justify-between gap-2">
                <dt className="flex items-center gap-2 text-zinc-500">
                  <Gamepad2 className="size-3.5" />
                  Jeu
                </dt>
                <dd className="text-right font-medium text-white">
                  {tournament.game}
                </dd>
              </div>
            )}
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <Swords className="size-3.5" />
                Format
              </dt>
              <dd className="text-right font-medium text-white">
                {isTeam
                  ? `${FORMAT_LABELS[tournament.format]} (${tournament.teamSize}v${tournament.teamSize})`
                  : FORMAT_LABELS[tournament.format]}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <Users className="size-3.5" />
                Places
              </dt>
              <dd className="text-right text-zinc-300">
                {tournament._count.registrations}
                {tournament.maxTeams
                  ? ` / ${tournament.maxTeams}`
                  : ' (illimit\u00e9)'}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <Hash className="size-3.5" />
                Slug
              </dt>
              <dd className="text-right font-mono text-xs text-zinc-400">
                {tournament.slug}
              </dd>
            </div>
          </dl>
        </div>

        {/* Dates card */}
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Calendar className="size-4 text-blue-400" />
            Dates
          </h2>
          <dl className="space-y-3 text-sm">
            <DateRow
              icon={CalendarCheck}
              label="D\u00e9but"
              date={tournament.startDate}
            />
            <DateRow icon={CalendarX} label="Fin" date={tournament.endDate} />
            <div className="my-2 border-t border-white/5" />
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <Clock className="size-3.5" />
                Inscriptions
              </dt>
              <dd
                className={cn(
                  'text-right text-xs font-semibold',
                  registrationStatus.className,
                )}
              >
                {registrationStatus.label}
              </dd>
            </div>
            <DateRow
              icon={CalendarCheck}
              label="Ouverture"
              date={tournament.registrationOpen}
            />
            <DateRow
              icon={CalendarX}
              label="Fermeture"
              date={tournament.registrationClose}
            />
          </dl>
        </div>

        {/* Configuration card */}
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Settings className="size-4 text-blue-400" />
            Configuration
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <dt className="flex items-center gap-2 text-zinc-500">
                <CreditCard className="size-3.5" />
                Inscription
              </dt>
              <dd className="text-right">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    isPaid
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-emerald-500/10 text-emerald-400',
                  )}
                >
                  {isPaid &&
                  tournament.entryFeeAmount &&
                  tournament.entryFeeCurrency
                    ? `${formatAmount(tournament.entryFeeAmount, tournament.entryFeeCurrency)}`
                    : REGISTRATION_TYPE_LABELS[tournament.registrationType]}
                </span>
              </dd>
            </div>
            {isPaid && (
              <div className="flex items-start justify-between gap-2">
                <dt className="flex items-center gap-2 text-zinc-500">
                  <RefreshCw className="size-3.5" />
                  Remboursement
                </dt>
                <dd className="text-right text-zinc-300">
                  {REFUND_POLICY_LABELS[tournament.refundPolicyType]}
                  {tournament.refundPolicyType ===
                    RefundPolicyType.BEFORE_DEADLINE &&
                    tournament.refundDeadlineDays && (
                      <span className="ml-1 text-zinc-500">
                        ({tournament.refundDeadlineDays}j)
                      </span>
                    )}
                </dd>
              </div>
            )}
            {tournament.toornamentId && (
              <div className="flex items-start justify-between gap-2">
                <dt className="flex items-center gap-2 text-zinc-500">
                  <Layers className="size-3.5" />
                  Toornament
                </dt>
                <dd className="text-right">
                  <a
                    href={`https://www.toornament.com/tournaments/${tournament.toornamentId}/information`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 transition-colors hover:text-blue-300"
                  >
                    {tournament.toornamentId.slice(0, 12)}...
                    <ExternalLink className="size-3" />
                  </a>
                </dd>
              </div>
            )}
            {tournament.streamUrl && (
              <div className="flex items-start justify-between gap-2">
                <dt className="flex items-center gap-2 text-zinc-500">
                  <Video className="size-3.5" />
                  Stream
                </dt>
                <dd className="text-right">
                  <a
                    href={tournament.streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 transition-colors hover:text-blue-300"
                  >
                    Lien
                    <ExternalLink className="size-3" />
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Markdown sections */}
      {tournament.description && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <FileText className="size-4 text-blue-400" />
            Description
          </h2>
          <Markdown content={tournament.description} />
        </div>
      )}

      {tournament.rules && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Shield className="size-4 text-blue-400" />
            R\u00e8gles
          </h2>
          <Markdown content={tournament.rules} />
        </div>
      )}

      {tournament.prize && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Trophy className="size-4 text-amber-400" />
            Prix
          </h2>
          <Markdown content={tournament.prize} />
        </div>
      )}

      {/* Custom fields listing */}
      {hasCustomFields && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <FileText className="size-4 text-blue-400" />
            Champs personnalis\u00e9s ({tournament.fields.length})
          </h2>
          <div className="space-y-2">
            {tournament.fields.map(field => (
              <div
                key={field.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/2 px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">#{field.order}</span>
                  <span className="text-sm font-medium text-zinc-200">
                    {field.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                    {field.type}
                  </span>
                  {field.required && (
                    <span className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                      Requis
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {tournament.status === TournamentStatus.PUBLISHED &&
            tournament._count.registrations > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
                <AlertTriangle className="size-3.5 shrink-0" />
                Les champs ne peuvent pas \u00eatre modifi\u00e9s car le tournoi
                est publi\u00e9 avec des inscrits.
              </div>
            )}
        </div>
      )}

      {/* Toornament stages */}
      {hasToornamentStages && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Layers className="size-4 text-blue-400" />
            Stages Toornament ({tournament.toornamentStages.length})
          </h2>
          <div className="space-y-2">
            {tournament.toornamentStages.map(stage => (
              <div
                key={stage.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/2 px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">#{stage.number}</span>
                  <span className="text-sm font-medium text-zinc-200">
                    {stage.name}
                  </span>
                </div>
                <span className="font-mono text-xs text-zinc-500">
                  {stage.stageId}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata footer */}
      <div className="flex flex-wrap gap-4 text-xs text-zinc-600">
        <span>Cr\u00e9\u00e9 le {formatDate(tournament.createdAt)}</span>
        <span>Modifi\u00e9 le {formatDate(tournament.updatedAt)}</span>
        <span className="font-mono">ID: {tournament.id}</span>
      </div>
    </div>
  )
}
