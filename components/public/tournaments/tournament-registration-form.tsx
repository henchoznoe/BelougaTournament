/**
 * File: components/public/tournaments/tournament-registration-form.tsx
 * Description: Client-side registration form for public tournament pages (solo and team formats).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noe Henchoz
 */

'use client'

import {
  CheckCircle,
  CreditCard,
  Loader2,
  LogIn,
  Send,
  UserCheck,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { authClient } from '@/lib/core/auth-client'
import type { ActionState } from '@/lib/types/actions'
import type {
  AvailableTeam,
  PublicTournamentDetail,
  TournamentFieldItem,
  UserTournamentRegistrationState,
} from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import { formatCentimes } from '@/lib/utils/formatting'
import {
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
    | 'teamLogoEnabled'
  >
  tournamentId: string
  fields: TournamentFieldItem[]
  format: TournamentFormat
  teamSize: number
  availableTeams: AvailableTeam[]
  registrationState: UserTournamentRegistrationState | null
  isAuthenticated: boolean
}

/** Maps dynamic field values from form (all strings) to proper types for the action. */
const buildFieldValues = (
  formData: Record<string, string>,
  fields: TournamentFieldItem[],
): Record<string, string | number> => {
  const result: Record<string, string | number> = {}
  for (const field of fields) {
    const raw = formData[field.label] ?? ''
    if (field.type === FieldType.NUMBER && raw !== '') {
      result[field.label] = Number(raw)
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
}: TournamentRegistrationFormProps) => {
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPath =
    searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname

  // Team-specific state
  const [teamMode, setTeamMode] = useState<'create' | 'join'>('create')
  const [teamName, setTeamName] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Record<string, string>>({
    defaultValues: Object.fromEntries(fields.map(f => [f.label, ''])),
  })

  const onSubmit = (data: Record<string, string>) => {
    // Client-side team field validation
    if (format === TournamentFormat.TEAM) {
      if (teamMode === 'create') {
        const trimmed = teamName.trim()
        if (
          trimmed.length < VALIDATION_LIMITS.TEAM_NAME_MIN ||
          trimmed.length > VALIDATION_LIMITS.TEAM_NAME_MAX
        ) {
          toast.error(
            `Le nom de l'équipe doit contenir entre ${VALIDATION_LIMITS.TEAM_NAME_MIN} et ${VALIDATION_LIMITS.TEAM_NAME_MAX} caractères.`,
          )
          return
        }
      } else {
        if (!selectedTeamId) {
          toast.error('Veuillez sélectionner une équipe.')
          return
        }
      }
    }

    startTransition(async () => {
      const fieldValues = buildFieldValues(data, fields)

      let result: ActionState<{ checkoutUrl: string }>

      if (format === TournamentFormat.TEAM) {
        if (teamMode === 'create') {
          result = await createTeamAndRegister({
            tournamentId,
            returnPath: currentPath,
            teamName: teamName.trim(),
            fieldValues,
          })
        } else {
          result = await joinTeamAndRegister({
            tournamentId,
            returnPath: currentPath,
            teamId: selectedTeamId,
            fieldValues,
          })
        }
      } else {
        result = await registerForTournament({
          tournamentId,
          returnPath: currentPath,
          fieldValues,
        })
      }

      if (result.success) {
        if (result.data?.checkoutUrl) {
          window.location.href = result.data.checkoutUrl
          return
        }

        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  // Loading state: only show spinner when the client session is still pending
  // AND the server didn't already resolve the auth state (prevents hydration mismatch)
  if (isSessionPending && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="size-5 animate-spin text-zinc-500" />
      </div>
    )
  }

  // Not authenticated: show login CTA
  if (!session?.user && !isAuthenticated) {
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

  // Registration form
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {isPaidTournament && entryFeeLabel && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-zinc-300">
          <p className="flex items-center gap-2 font-medium text-white">
            <CreditCard className="size-4 text-blue-400" />
            Inscription payante: {entryFeeLabel}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Votre place est réservée pendant {REGISTRATION_HOLD_MINUTES} minutes
            au moment de la redirection vers Stripe. Si vous quittez la page
            Stripe sans payer, votre place sera libérée.
          </p>
        </div>
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
          <div className="flex gap-2">
            <Button
              type="button"
              variant={teamMode === 'create' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'flex-1 gap-2',
                teamMode !== 'create' &&
                  'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200',
              )}
              onClick={() => setTeamMode('create')}
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
                'flex-1 gap-2',
                teamMode !== 'join' &&
                  'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200',
              )}
              onClick={() => setTeamMode('join')}
              disabled={isPending}
            >
              <Users className="size-4" />
              Rejoindre une équipe
            </Button>
          </div>

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
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                disabled={isPending}
                placeholder="Entrez le nom de votre équipe"
                maxLength={VALIDATION_LIMITS.TEAM_NAME_MAX}
                className="h-9 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20"
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
                    className="h-9 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 focus:border-blue-500/30 focus:ring-blue-500/20"
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
                <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-zinc-500">
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
        <div className="space-y-4">
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
                className="h-9 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20"
                {...register(field.label, {
                  required: field.required
                    ? `Le champ « ${field.label} » est requis.`
                    : false,
                  ...(field.type === FieldType.NUMBER
                    ? { valueAsNumber: false }
                    : {}),
                })}
              />
              {errors[field.label] && (
                <p className="text-xs text-red-400">
                  {errors[field.label]?.message}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-zinc-500">
          Aucun champ supplémentaire n'est requis.
        </p>
      )}
      {/* Fields editable hint — shown only when there are custom fields */}
      {fields.length > 0 && (
        <p className="text-center text-xs text-zinc-500">
          Si un champ venait à changer, vous pouvez modifier vos réponses depuis
          la page de votre profil.
        </p>
      )}
      <p className="text-center text-xs text-zinc-500">
        <CheckCircle className="mr-1 inline size-3 text-emerald-500" />
        {isPaidTournament
          ? 'Votre inscription sera confirmée après paiement Stripe.'
          : 'Votre inscription sera enregistrée.'}
      </p>
      <Button type="submit" disabled={isPending} className="w-full gap-2">
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isPaidTournament ? (
          <CreditCard className="size-4" />
        ) : (
          <Send className="size-4" />
        )}
        {format === TournamentFormat.TEAM
          ? teamMode === 'create'
            ? isPaidTournament
              ? 'Créer et payer'
              : "Créer et s'inscrire"
            : isPaidTournament
              ? 'Rejoindre et payer'
              : "Rejoindre et s'inscrire"
          : isPaidTournament
            ? 'Payer et s’inscrire'
            : "S'inscrire"}
      </Button>
      <p className="text-center text-xs text-zinc-500">
        En procédant {isPaidTournament ? 'au paiement' : "à l'inscription"},
        vous confirmez accepter nos{' '}
        <Link href={ROUTES.TERMS} className="text-blue-500 hover:underline">
          conditions générales
        </Link>
        .
      </p>
    </form>
  )
}
