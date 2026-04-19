/**
 * File: components/admin/tournaments/tournament-detail.tsx
 * Description: Tournament overview with stats, info cards, dates, configuration, and rich text sections.
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
  ImageIcon,
  Info,
  Layers,
  RefreshCw,
  Settings,
  Shield,
  Swords,
  Trophy,
  Users,
  Video,
} from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { RichText } from '@/components/ui/rich-text'
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
  [TournamentFormat.TEAM]: 'Équipe',
} as const

const REGISTRATION_TYPE_LABELS: Record<RegistrationType, string> = {
  [RegistrationType.FREE]: 'Gratuit',
  [RegistrationType.PAID]: 'Payant',
} as const

const REFUND_POLICY_LABELS: Record<RefundPolicyType, string> = {
  [RefundPolicyType.NONE]: 'Aucun remboursement',
  [RefundPolicyType.BEFORE_DEADLINE]: 'Avant délai',
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatAmount = (amount: number, currency: string) => {
  return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
}

/** Returns a temporal indicator for a date relative to now. */
const getDateIndicator = (date: Date): { label: string; className: string } => {
  const now = new Date()
  const d = new Date(date)
  if (d < now) return { label: 'Passé', className: 'text-zinc-500' }
  // Within 24h
  const diff = d.getTime() - now.getTime()
  if (diff < 24 * 60 * 60 * 1000)
    return { label: 'Bientôt', className: 'text-amber-400' }
  return { label: 'À venir', className: 'text-emerald-400' }
}

// ─── Tournament Image Gallery ────────────────────────────────────────────────

interface TournamentImageGalleryProps {
  imageUrls: string[]
  name: string
}

const TournamentImageGallery = ({
  imageUrls,
  name,
}: TournamentImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (imageUrls.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-white/5 bg-white/2">
        <p className="text-sm text-zinc-500">Aucune image</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-[3/1] overflow-hidden rounded-xl border border-white/5 bg-white/2">
        <Image
          src={imageUrls[selectedIndex]}
          alt={`${name} — image ${selectedIndex + 1}`}
          fill
          className="object-contain p-4"
          sizes="(max-width: 768px) 100vw, 800px"
          priority
        />
      </div>

      {/* Thumbnails (only if more than 1 image) */}
      {imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imageUrls.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`Voir image ${index + 1}`}
              className={cn(
                'relative size-16 shrink-0 overflow-hidden rounded-lg border transition-all',
                'hover:border-white/20',
                index === selectedIndex
                  ? 'border-blue-500 ring-1 ring-blue-500/50'
                  : 'border-white/5 bg-white/2',
              )}
            >
              <Image
                src={url}
                alt={`${name} — miniature ${index + 1}`}
                fill
                className="object-contain p-1"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
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
      label: isTeam ? 'Joueurs inscrits' : 'Inscriptions',
      value: isTeam
        ? `${tournament._count.registrations}`
        : `${tournament._count.registrations} ${maxLabel}`,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    ...(isTeam
      ? [
          {
            icon: Swords,
            label: 'Équipes',
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
          ? `${REGISTRATION_TYPE_LABELS[tournament.registrationType]} — ${formatAmount(tournament.entryFeeAmount, tournament.entryFeeCurrency)}`
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
    return { label: 'Fermées', className: 'text-red-400' }
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
                {isTeam ? 'Équipes' : 'Places'}
              </dt>
              <dd className="text-right text-zinc-300">
                {isTeam
                  ? tournament._count.teams
                  : tournament._count.registrations}
                {tournament.maxTeams
                  ? ` / ${tournament.maxTeams}`
                  : ' (illimité)'}
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
              label="Début"
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
            {isTeam && (
              <div className="flex items-start justify-between gap-2">
                <dt className="flex items-center gap-2 text-zinc-500">
                  <ImageIcon className="size-3.5" />
                  Logo d'équipe
                </dt>
                <dd className="text-right">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      tournament.teamLogoEnabled
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-zinc-500/10 text-zinc-400',
                    )}
                  >
                    {tournament.teamLogoEnabled ? 'Activé' : 'Désactivé'}
                  </span>
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

      {/* Rich text sections */}
      {tournament.description && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <FileText className="size-4 text-blue-400" />
            Description
          </h2>
          <RichText content={tournament.description} />
        </div>
      )}

      {tournament.rules && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Shield className="size-4 text-blue-400" />
            Règles
          </h2>
          <RichText content={tournament.rules} />
        </div>
      )}

      {tournament.prize && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Trophy className="size-4 text-amber-400" />
            Prix
          </h2>
          <RichText content={tournament.prize} />
        </div>
      )}

      {/* Custom fields listing */}
      {hasCustomFields && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <FileText className="size-4 text-blue-400" />
            Champs personnalisés ({tournament.fields.length})
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
                Les champs ne peuvent pas être modifiés car le tournoi est
                publié avec des inscrits.
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

      {/* Tournament images */}
      {tournament.imageUrls.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <ImageIcon className="size-4 text-blue-400" />
            Images
          </h2>
          <TournamentImageGallery
            imageUrls={tournament.imageUrls}
            name={tournament.title}
          />
        </div>
      )}

      {/* Metadata footer */}
      <div className="flex flex-wrap gap-4 text-xs text-zinc-600">
        <span>Créé le {formatDate(tournament.createdAt)}</span>
        <span>Modifié le {formatDate(tournament.updatedAt)}</span>
        <span className="font-mono">ID: {tournament.id}</span>
      </div>
    </div>
  )
}
