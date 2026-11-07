/**
 * File: components/public/tournaments/tournament-registration-form.tsx
 * Description: Client-side registration form for public tournament pages (solo and team formats).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  CheckCircle,
  CreditCard,
  Gift,
  Loader2,
  LogIn,
  Send,
  UserCheck,
  Users,
} from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AddToCalendarButton } from '@/components/public/tournaments/add-to-calendar-button'
import { ActionFeedback } from '@/components/ui/action-feedback'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PendingLink as Link } from '@/components/ui/pending-link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createTeamAndRegister,
  joinTeamAndRegister,
  registerForTournament,
} from '@/lib/actions/tournament-registration'
import {
  REGISTRATION_HOLD_MINUTES,
  VALIDATION_LIMITS,
} from '@/lib/config/constants'
import { ROUTES } from '@/lib/config/routes'
import type { ActionState } from '@/lib/types/actions'
import type {
  AvailableTeam,
  PublicTournamentDetail,
  TournamentFieldItem,
  UserTournamentRegistrationState,
} from '@/lib/types/tournament'
import type { CalendarEventData } from '@/lib/utils/calendar'
import { cn } from '@/lib/utils/cn'
import { formatCentimes, parseCentimes } from '@/lib/utils/formatting'
import { posthogBrowser as posthog } from '@/lib/utils/posthog-browser'
import { getRefundPolicyLabel } from '@/lib/utils/refund-policy-label'
import {
  DonationType,
  FieldType,
  PaymentStatus,
  RegistrationStatus,
  RegistrationType,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

interface TournamentRegistrationFormProps {
  tournament: Pick<
    PublicTournamentDetail,
    | 'id'
    | 'registrationType'
    | 'entryFeeAmount'
    | 'entryFeeCurrency'
    | 'refundPolicyType'
    | 'refundDeadlineDays'
    | 'teamLogoEnabled'
    | 'donationEnabled'
    | 'donationType'
    | 'donationFixedAmount'
    | 'donationMinAmount'
    | 'maxTeams'
    | '_count'
  >
  tournamentId: string
  fields: TournamentFieldItem[]
  format: TournamentFormat
  teamSize: number
  availableTeams: AvailableTeam[]
  registrationState: UserTournamentRegistrationState | null
  isAuthenticated: boolean
  registrationStateLoading: boolean
  onRegistrationChanged: () => Promise<void>
  calendarData?: CalendarEventData
}

/** Maps dynamic field values from form (all strings) to proper types for the action. */
const buildFieldValues = (
  formData: Record<string, string | number>,
  fields: TournamentFieldItem[],
): Record<string, string | number> => {
  const result: Record<string, string | number> = {}
  for (const field of fields) {
    const raw = formData[field.label] ?? ''
    if (field.type === FieldType.NUMBER && raw !== '') {
      result[field.label] = Number.isFinite(Number(raw)) ? Number(raw) : ''
    } else {
      result[field.label] = raw
    }
  }
  return result
}

export const TournamentRegistrationForm = ({
  tournament,
  tournamentId,
  fields,
  format,
  teamSize,
  availableTeams,
  registrationState,
  isAuthenticated,
  registrationStateLoading,
  onRegistrationChanged,
  calendarData,
}: TournamentRegistrationFormProps) => {
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPath =
    searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname

  // Team-specific state
  const teamsFull =
    tournament.maxTeams !== null &&
    tournament.maxTeams > 0 &&
    tournament._count.teams >= tournament.maxTeams
  const [teamMode, setTeamMode] = useState<'create' | 'join'>(
    teamsFull && availableTeams.length > 0 ? 'join' : 'create',
  )
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [teamError, setTeamError] = useState<string | null>(null)
  const [teamName, setTeamName] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState('')

  // Donation state
  const [donationChecked, setDonationChecked] = useState(false)
  const [donationInput, setDonationInput] = useState('')
  const [donationAmountCentimes, setDonationAmountCentimes] = useState<
    number | null
  >(null)
  const [donationError, setDonationError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Record<string, string | number>>({
    defaultValues: Object.fromEntries(fields.map(f => [f.label, ''])),
  })

  /** Returns the resolved donation amount in centimes (0 if not applicable). */
  const getResolvedDonation = (): number | null => {
    if (!tournament.donationEnabled) return null
    if (tournament.donationType === DonationType.FIXED) {
      return donationChecked ? (tournament.donationFixedAmount ?? null) : null
    }
    if (tournament.donationType === DonationType.FREE) {
      return donationAmountCentimes && donationAmountCentimes > 0
        ? donationAmountCentimes
        : null
    }
    return null
  }

  /** Returns true if the donation section has a blocking validation error. */
  const hasDonationError = (): boolean => {
    if (!tournament.donationEnabled) return false
    if (tournament.donationType === DonationType.FREE && donationInput !== '') {
      const parsed = Number.parseFloat(donationInput.replace(',', '.'))
      if (!Number.isNaN(parsed) && parsed > 0) {
        const centimes = parseCentimes(parsed)
        const min = tournament.donationMinAmount ?? 0
        if (centimes < min) return true
      }
    }
    return false
  }

  const onSubmit = (data: Record<string, string | number>) => {
    setSubmissionError(null)
    setTeamError(null)
    // Client-side team field validation
    if (format === TournamentFormat.TEAM) {
      if (teamMode === 'create') {
        const trimmed = teamName.trim()
        if (
          trimmed.length < VALIDATION_LIMITS.TEAM_NAME_MIN ||
          trimmed.length > VALIDATION_LIMITS.TEAM_NAME_MAX
        ) {
          setTeamError(
            `Le nom de l'équipe doit contenir entre ${VALIDATION_LIMITS.TEAM_NAME_MIN} et ${VALIDATION_LIMITS.TEAM_NAME_MAX} caractères.`,
          )
          document.getElementById('team-name')?.focus()
          return
        }
      } else {
        if (!selectedTeamId) {
          setTeamError('Veuillez sélectionner une équipe.')
          document.getElementById('team-select')?.focus()
          return
        }
      }
    }

    // Block if donation free mode is invalid
    if (hasDonationError()) {
      toast.error(
        `Le montant du don doit être d'au moins ${formatCentimes(tournament.donationMinAmount ?? 0, tournament.entryFeeCurrency ?? 'CHF')}.`,
      )
      return
    }

    const resolvedDonation = getResolvedDonation()

    startTransition(async () => {
      const fieldValues = buildFieldValues(data, fields)

      let result: ActionState<{ checkoutUrl: string }>

      try {
        if (format === TournamentFormat.TEAM) {
          if (teamMode === 'create') {
            result = await createTeamAndRegister({
              tournamentId,
              returnPath: currentPath,
              teamName: teamName.trim(),
              fieldValues,
              donationAmount: resolvedDonation,
            })
          } else {
            result = await joinTeamAndRegister({
              tournamentId,
              returnPath: currentPath,
              teamId: selectedTeamId,
              fieldValues,
              donationAmount: resolvedDonation,
            })
          }
        } else {
          result = await registerForTournament({
            tournamentId,
            returnPath: currentPath,
            fieldValues,
            donationAmount: resolvedDonation,
          })
        }

        if (result.success) {
          if (result.data?.checkoutUrl) {
            posthog.capture('tournament_checkout_initiated', {
              tournament_id: tournamentId,
              format: format,
              team_mode:
                format === TournamentFormat.TEAM ? teamMode : undefined,
              registration_type: tournament.registrationType,
            })
            window.location.href = result.data.checkoutUrl
            return
          }

          posthog.capture('tournament_registration_confirmed', {
            tournament_id: tournamentId,
            format: format,
            team_mode: format === TournamentFormat.TEAM ? teamMode : undefined,
            registration_type: tournament.registrationType,
          })
          toast.success(result.message)
          await onRegistrationChanged()
          router.refresh()
        } else {
          setSubmissionError(
            result.message ??
              'Une erreur est survenue. Vos réponses sont conservées.',
          )
        }
      } catch {
        setSubmissionError(
          'La demande n’a pas pu aboutir. Vos réponses sont conservées ; réessayez.',
        )
      }
    })
  }

  if (registrationStateLoading) {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-300"
      >
        <Loader2 className="size-4 animate-spin" />
        Vérification de votre inscription…
      </div>
    )
  }

  // Not authenticated: show login CTA
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <p className="text-sm text-zinc-400">
          Connectez-vous pour vous inscrire à ce tournoi.
        </p>
        <Button asChild className="gap-2">
          <Link
            href={`${ROUTES.LOGIN}?from=${encodeURIComponent(currentPath)}`}
          >
            <LogIn className="size-4" />
            Se connecter
          </Link>
        </Button>
      </div>
    )
  }

  // Already registered: show confirmation and link to profile
  if (registrationState?.status === RegistrationStatus.CONFIRMED) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="inline-flex rounded-full bg-emerald-500/10 p-3 ring-1 ring-emerald-500/20">
          <UserCheck className="size-5 text-emerald-400" />
        </div>
        <p className="text-sm text-zinc-300">
          Vous êtes déjà inscrit à ce tournoi.
        </p>
        <Button
          asChild
          variant="outline"
          className="gap-2 border-white/10 bg-white/5 hover:bg-white/10"
        >
          <Link href={`${ROUTES.PROFILE}#inscriptions`}>
            Voir / modifier mon inscription
          </Link>
        </Button>
        {calendarData && (
          <AddToCalendarButton variant="full" tournament={calendarData} />
        )}
      </div>
    )
  }

  const isPendingRegistration =
    registrationState?.status === RegistrationStatus.PENDING
  const isPaidTournament = tournament.registrationType === RegistrationType.PAID
  const entryFeeLabel =
    tournament.entryFeeAmount !== null
      ? formatCentimes(
          tournament.entryFeeAmount,
          tournament.entryFeeCurrency ?? 'CHF',
        )
      : null
  const donationBlocksSubmit = hasDonationError()

  const capacityReached =
    tournament.maxTeams !== null &&
    tournament.maxTeams > 0 &&
    (format === TournamentFormat.SOLO
      ? tournament._count.registrations >= tournament.maxTeams
      : teamsFull && teamMode === 'create') &&
    !isPendingRegistration

  // Registration form
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-busy={isPending}
      className="space-y-5"
    >
      {submissionError && (
        <ActionFeedback tone="error" title="Inscription non finalisée">
          <p>{submissionError}</p>
        </ActionFeedback>
      )}
      {capacityReached && (
        <ActionFeedback title="Capacité atteinte">
          <p>
            {format === TournamentFormat.TEAM && availableTeams.length > 0
              ? 'Toutes les places d’équipe sont prises. Vous pouvez rejoindre une équipe existante ci-dessous.'
              : 'Les places disponibles sont actuellement prises. Revenez vérifier si une place se libère.'}
          </p>
        </ActionFeedback>
      )}
      {isPendingRegistration && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium text-amber-300">Paiement en attente</p>
          <p className="mt-1 text-xs text-amber-200/80">
            Votre inscription est en attente de confirmation Stripe. Si votre
            session a expiré, vous pouvez relancer le paiement avec ce
            formulaire.
          </p>
          {registrationState.paymentStatus === PaymentStatus.CANCELLED && (
            <p className="mt-1 text-xs text-amber-200/80">
              La précédente session Stripe a expiré ou a été annulée.
            </p>
          )}
        </div>
      )}

      {/* Team mode selector (TEAM format only) */}
      {format === TournamentFormat.TEAM && (
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant={teamMode === 'create' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'min-w-0 gap-2 whitespace-normal',
                teamMode !== 'create' &&
                  'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200',
              )}
              aria-pressed={teamMode === 'create'}
              onClick={() => {
                setTeamMode('create')
                setTeamError(null)
              }}
              disabled={isPending}
            >
              <Users className="size-4" />
              Créer une équipe
            </Button>
            <Button
              type="button"
              variant={teamMode === 'join' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'min-w-0 gap-2 whitespace-normal',
                teamMode !== 'join' &&
                  'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200',
              )}
              aria-pressed={teamMode === 'join'}
              onClick={() => {
                setTeamMode('join')
                setTeamError(null)
              }}
              disabled={isPending}
            >
              <Users className="size-4" />
              Rejoindre une équipe
            </Button>
          </div>

          {teamError && (
            <p id="team-error" role="alert" className="text-sm text-red-300">
              {teamError}
            </p>
          )}
          {/* Create mode: team name input */}
          {teamMode === 'create' && (
            <div className="space-y-1.5">
              <Label htmlFor="team-name" className="text-xs text-zinc-400">
                Nom de l'équipe
                <span className="ml-0.5 text-red-400">*</span>
              </Label>
              <Input
                id="team-name"
                type="text"
                aria-invalid={Boolean(teamError)}
                aria-describedby={teamError ? 'team-error' : undefined}
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                disabled={isPending}
                placeholder="Entrez le nom de votre équipe"
                maxLength={VALIDATION_LIMITS.TEAM_NAME_MAX}
                className="h-9 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-brand/30 focus-visible:ring-brand/20"
              />
            </div>
          )}

          {/* Join mode: team select dropdown */}
          {teamMode === 'join' && (
            <div className="space-y-1.5">
              <Label htmlFor="team-select" className="text-xs text-zinc-400">
                Équipe
                <span className="ml-0.5 text-red-400">*</span>
              </Label>
              {availableTeams.length > 0 ? (
                <Select
                  value={selectedTeamId}
                  onValueChange={setSelectedTeamId}
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="team-select"
                    aria-invalid={Boolean(teamError)}
                    aria-describedby={teamError ? 'team-error' : undefined}
                    className="h-9 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 focus:border-brand/30 focus:ring-brand/20"
                  >
                    <SelectValue placeholder="Sélectionnez une équipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} — Capitaine: {team.captain.displayName} (
                        {team._count.members}/{teamSize} membres)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-zinc-400">
                  Aucune équipe disponible. Créez la vôtre !
                </p>
              )}
            </div>
          )}
        </div>
      )}
      {/* Team logo hint — shown only when creating a team and logo upload is enabled */}
      {format === TournamentFormat.TEAM &&
        teamMode === 'create' &&
        tournament.teamLogoEnabled && (
          <div className="rounded-2xl border border-zinc-500/20 bg-zinc-500/5 px-4 py-3 text-xs text-zinc-400">
            <p>
              En tant que capitaine, vous pourrez ajouter un logo d&apos;équipe
              depuis votre profil après inscription.
            </p>
          </div>
        )}
      {/* Dynamic fields */}
      {fields.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(field => (
            <div key={field.id} className="space-y-1.5">
              <Label
                htmlFor={`field-${field.id}`}
                className="text-xs text-zinc-400"
              >
                {field.label}
                {field.required && (
                  <span className="ml-0.5 text-red-400">*</span>
                )}
              </Label>
              <Input
                id={`field-${field.id}`}
                type={field.type === FieldType.NUMBER ? 'number' : 'text'}
                disabled={isPending}
                aria-invalid={Boolean(errors[field.label])}
                aria-describedby={
                  errors[field.label] ? `error-${field.id}` : undefined
                }
                className="h-11 rounded-xl border-white/15 bg-white/5 text-base text-zinc-200 placeholder:text-zinc-400 focus-visible:border-brand/30 focus-visible:ring-brand/20"
                {...register(field.label, {
                  required: field.required
                    ? `Le champ « ${field.label} » est requis.`
                    : false,
                  ...(field.type === FieldType.NUMBER
                    ? { valueAsNumber: true }
                    : {}),
                })}
              />
              {errors[field.label] && (
                <p
                  id={`error-${field.id}`}
                  role="alert"
                  className="text-sm text-red-300"
                >
                  {errors[field.label]?.message}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-zinc-400">
          Aucun champ supplémentaire n'est requis.
        </p>
      )}
      {/* Fields editable hint — shown only when there are custom fields */}
      {fields.length > 0 && (
        <p className="text-center text-xs text-zinc-400">
          Si un champ venait à changer, vous pouvez modifier vos réponses depuis
          la page de votre profil.
        </p>
      )}
      {/* Optional donation (paid tournaments only) */}
      {isPaidTournament && tournament.donationEnabled && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm">
          <p className="flex items-center gap-2 font-medium text-emerald-300">
            <Gift className="size-4" />
            Don optionnel
          </p>

          {tournament.donationType === DonationType.FIXED &&
            tournament.donationFixedAmount !== null && (
              <div className="mt-3 flex items-center gap-3">
                <Checkbox
                  id="donation-fixed"
                  checked={donationChecked}
                  onCheckedChange={checked =>
                    setDonationChecked(checked === true)
                  }
                  disabled={isPending}
                />
                <Label
                  htmlFor="donation-fixed"
                  className="cursor-pointer text-xs text-zinc-300"
                >
                  Ajouter un don de{' '}
                  <span className="font-semibold text-emerald-300">
                    {formatCentimes(
                      tournament.donationFixedAmount,
                      tournament.entryFeeCurrency ?? 'CHF',
                    )}
                  </span>
                </Label>
              </div>
            )}

          {tournament.donationType === DonationType.FREE && (
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="donation-free" className="text-xs text-zinc-400">
                Montant du don ({tournament.entryFeeCurrency ?? 'CHF'})
                {tournament.donationMinAmount !== null && (
                  <span className="ml-1 text-zinc-400">
                    (minimum{' '}
                    {formatCentimes(
                      tournament.donationMinAmount,
                      tournament.entryFeeCurrency ?? 'CHF',
                    )}
                    )
                  </span>
                )}
              </Label>
              <Input
                id="donation-free"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                disabled={isPending}
                className={cn(
                  'h-9 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-emerald-500/30 focus-visible:ring-emerald-500/20',
                  donationBlocksSubmit && 'border-red-500/50',
                )}
                value={donationInput}
                onChange={e => {
                  const raw = e.target.value
                  if (raw !== '' && !/^\d*[.,]?\d{0,2}$/.test(raw)) return
                  setDonationInput(raw)
                  const parsed = Number.parseFloat(raw.replace(',', '.'))
                  if (raw === '' || Number.isNaN(parsed) || parsed <= 0) {
                    setDonationAmountCentimes(null)
                    setDonationError(null)
                  } else {
                    const centimes = parseCentimes(parsed)
                    setDonationAmountCentimes(centimes)
                    const min = tournament.donationMinAmount ?? 0
                    if (centimes < min) {
                      setDonationError(
                        `Le montant doit être d'au moins ${formatCentimes(min, tournament.entryFeeCurrency ?? 'CHF')}.`,
                      )
                    } else {
                      setDonationError(null)
                    }
                  }
                }}
              />
              {donationError && (
                <p className="text-xs text-red-400">{donationError}</p>
              )}
            </div>
          )}

          <p className="mt-2 text-xs text-amber-300/80">
            Le don n&apos;est jamais remboursé, même en cas de désistement.
          </p>
        </div>
      )}

      {isPaidTournament && entryFeeLabel && (
        <div className="rounded-2xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-zinc-300">
          <p className="flex items-center gap-2 font-medium text-white">
            <CreditCard className="size-4 text-brand" />
            Inscription payante : {entryFeeLabel} par joueur
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Votre place est réservée pendant {REGISTRATION_HOLD_MINUTES} minutes
            au moment de la redirection vers Stripe. Si vous quittez la page
            Stripe sans payer, votre place sera libérée.
          </p>
        </div>
      )}
      {isPaidTournament && (
        <div className="rounded-2xl border border-zinc-500/20 bg-zinc-500/5 px-4 py-3 text-sm text-zinc-300">
          <p className="text-xs text-zinc-400">
            {getRefundPolicyLabel(
              tournament.refundPolicyType,
              tournament.refundDeadlineDays,
            )}
          </p>
        </div>
      )}
      <div className="rounded-2xl border border-white/15 bg-white/3 p-4">
        <h4 className="mb-3 font-semibold text-white">Récapitulatif</h4>
        <dl className="space-y-2 text-sm text-zinc-300">
          <div className="flex flex-wrap justify-between gap-2">
            <dt>Inscription par joueur</dt>
            <dd>{isPaidTournament ? entryFeeLabel : 'Gratuit'}</dd>
          </div>
          {getResolvedDonation() ? (
            <div className="flex flex-wrap justify-between gap-2">
              <dt>Don facultatif</dt>
              <dd>
                {formatCentimes(
                  getResolvedDonation() ?? 0,
                  tournament.entryFeeCurrency ?? 'CHF',
                )}
              </dd>
            </div>
          ) : null}
          <div className="flex flex-wrap justify-between gap-2 border-t border-white/10 pt-2 font-semibold text-white">
            <dt>Total à payer pour vous</dt>
            <dd>
              {formatCentimes(
                (isPaidTournament ? (tournament.entryFeeAmount ?? 0) : 0) +
                  (getResolvedDonation() ?? 0),
                tournament.entryFeeCurrency ?? 'CHF',
              )}
            </dd>
          </div>
        </dl>
      </div>
      <p className="text-center text-xs text-zinc-400">
        <CheckCircle className="mr-1 inline size-3 text-emerald-500" />
        {isPaidTournament
          ? 'Votre inscription sera confirmée après paiement Stripe.'
          : 'Votre inscription sera enregistrée.'}
      </p>
      <Button
        type="submit"
        disabled={
          isPending ||
          donationBlocksSubmit ||
          capacityReached ||
          (format === TournamentFormat.TEAM &&
            teamMode === 'join' &&
            availableTeams.length === 0)
        }
        className="w-full gap-2"
        aria-busy={isPending}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isPaidTournament ? (
          <CreditCard className="size-4" />
        ) : (
          <Send className="size-4" />
        )}
        {isPending
          ? isPaidTournament
            ? 'Préparation du paiement…'
            : 'Inscription en cours…'
          : format === TournamentFormat.TEAM
            ? teamMode === 'create'
              ? isPaidTournament
                ? 'Créer et payer'
                : "Créer et s'inscrire"
              : isPaidTournament
                ? 'Rejoindre et payer'
                : "Rejoindre et s'inscrire"
            : isPaidTournament
              ? "Payer et s'inscrire"
              : "S'inscrire"}
      </Button>
      <p className="text-center text-xs text-zinc-400">
        En procédant {isPaidTournament ? 'au paiement' : "à l'inscription"},
        vous confirmez accepter nos{' '}
        <Link href={ROUTES.TERMS} className="text-brand hover:underline">
          conditions générales
        </Link>
        .
      </p>
    </form>
  )
}
