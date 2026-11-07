/**
 * File: components/admin/tournaments/form/tournament-form.tsx
 * Description: Main tournament form orchestrator for creating or editing a tournament.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { type FieldErrors, type Resolver, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useUnsavedChanges } from '@/components/admin/hooks/use-unsaved-changes'
import { TournamentFormContent } from '@/components/admin/tournaments/form/tournament-form-content'
import { TournamentFormDates } from '@/components/admin/tournaments/form/tournament-form-dates'
import { TournamentFormFields } from '@/components/admin/tournaments/form/tournament-form-fields'
import { TournamentFormFormat } from '@/components/admin/tournaments/form/tournament-form-format'
import { TournamentFormGames } from '@/components/admin/tournaments/form/tournament-form-games'
import { TournamentFormGeneral } from '@/components/admin/tournaments/form/tournament-form-general'
import { TournamentFormImages } from '@/components/admin/tournaments/form/tournament-form-images'
import { TournamentFormPayment } from '@/components/admin/tournaments/form/tournament-form-payment'
import { TournamentFormStages } from '@/components/admin/tournaments/form/tournament-form-stages'
import { ActionFeedback } from '@/components/ui/action-feedback'
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
import { createTournament, updateTournament } from '@/lib/actions/tournaments'
import { APP_TIME_ZONE } from '@/lib/config/constants'
import { TOURNAMENT_FORM_SECTIONS } from '@/lib/config/constants/form-sections'
import { ROUTES } from '@/lib/config/routes'
import type { TournamentDetail } from '@/lib/types/tournament'
import type { TournamentFormValues } from '@/lib/types/tournament-form'
import { getFirstErrorPath } from '@/lib/utils/form-errors'
import { fromNullable } from '@/lib/utils/formatting'
import {
  tournamentSchema,
  updateTournamentSchema,
} from '@/lib/validations/tournaments'
import {
  RefundPolicyType,
  RegistrationType,
  TournamentFormat,
  TournamentStatus,
} from '@/prisma/generated/prisma/enums'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate slug from title string. */
const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Convert ISO datetime string to datetime-local value in Swiss timezone (YYYY-MM-DDTHH:mm). */
const toDatetimeLocalValue = (iso: string | Date): string => {
  const date = new Date(iso)
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return formatter.format(date).replace(' ', 'T')
}

/** Convert datetime-local string (Swiss timezone) to ISO UTC datetime string.
 *  Uses convergent iteration to handle DST transition edge-cases correctly. */
const toISOFromLocal = (localStr: string): string => {
  const [datePart, timePart] = localStr.split('T')
  const naiveMs = Date.UTC(
    Number(datePart.slice(0, 4)),
    Number(datePart.slice(5, 7)) - 1,
    Number(datePart.slice(8, 10)),
    Number(timePart.slice(0, 2)),
    Number(timePart.slice(3, 5)),
  )

  const zurichOffsetAt = (utcMs: number): number => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: APP_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(new Date(utcMs))
    const get = (type: string) => parts.find(p => p.type === type)?.value ?? '0'
    const zurichAsUtc = Date.UTC(
      Number(get('year')),
      Number(get('month')) - 1,
      Number(get('day')),
      Number(get('hour')),
      Number(get('minute')),
      Number(get('second')),
    )
    return zurichAsUtc - utcMs
  }

  let utcGuess = naiveMs - zurichOffsetAt(naiveMs)
  const offset2 = zurichOffsetAt(utcGuess)
  utcGuess = naiveMs - offset2

  return new Date(utcGuess).toISOString()
}

// ─── Main Form ───────────────────────────────────────────────────────────────

interface TournamentFormProps {
  tournament?: TournamentDetail
}

export const TournamentForm = ({ tournament }: TournamentFormProps) => {
  const isEditing = !!tournament
  const [isPending, startTransition] = useTransition()
  const [mediaUploading, setMediaUploading] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const router = useRouter()

  const fieldsLocked =
    isEditing &&
    tournament.status === TournamentStatus.PUBLISHED &&
    tournament._count.registrations > 0

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TournamentFormValues>({
    // zodResolver cannot statically unify create/update schema types against TournamentFormValues;
    // cast through unknown to the concrete Resolver type to satisfy react-hook-form's generics.
    resolver: zodResolver(
      isEditing ? updateTournamentSchema : tournamentSchema,
    ) as unknown as Resolver<TournamentFormValues>,
    defaultValues: {
      id: tournament?.id ?? '',
      title: tournament?.title ?? '',
      slug: tournament?.slug ?? '',
      description: tournament?.description ?? '',
      startDate: tournament ? toDatetimeLocalValue(tournament.startDate) : '',
      endDate: tournament ? toDatetimeLocalValue(tournament.endDate) : '',
      registrationOpen: tournament
        ? toDatetimeLocalValue(tournament.registrationOpen)
        : '',
      registrationClose: tournament
        ? toDatetimeLocalValue(tournament.registrationClose)
        : '',
      maxTeams: tournament?.maxTeams ?? null,
      format: tournament?.format ?? TournamentFormat.SOLO,
      teamSize: tournament?.teamSize ?? 1,
      games: tournament?.games ?? [],
      rules: fromNullable(tournament?.rules ?? null),
      prize: fromNullable(tournament?.prize ?? null),
      registrationType: tournament?.registrationType ?? RegistrationType.FREE,
      entryFeeAmount: tournament?.entryFeeAmount ?? null,
      entryFeeCurrency: 'CHF',
      refundPolicyType: tournament?.refundPolicyType ?? RefundPolicyType.NONE,
      refundDeadlineDays: tournament?.refundDeadlineDays ?? null,
      teamLogoEnabled: tournament?.teamLogoEnabled ?? false,
      showRegistrants: tournament?.showRegistrants ?? false,
      donationEnabled: tournament?.donationEnabled ?? false,
      donationType: tournament?.donationType ?? null,
      donationFixedAmount: tournament?.donationFixedAmount ?? null,
      donationMinAmount: tournament?.donationMinAmount ?? null,
      toornamentId: fromNullable(tournament?.toornamentId ?? null),
      imageUrls: tournament?.imageUrls ?? [],
      streamUrl: fromNullable(tournament?.streamUrl ?? null),
      fields:
        tournament?.fields.map(f => ({
          id: f.id,
          label: f.label,
          type: f.type,
          required: f.required,
          order: f.order,
        })) ?? [],
      toornamentStages:
        tournament?.toornamentStages.map(s => ({
          id: s.id,
          name: s.name,
          stageId: s.stageId,
          number: s.number,
        })) ?? [],
    },
  })

  const watchTitle = watch('title')
  const watchSlug = watch('slug')
  const watchFormat = watch('format')
  const watchRegistrationType = watch('registrationType')
  const watchRefundPolicyType = watch('refundPolicyType')
  const watchImageUrls = watch('imageUrls')
  const watchMaxTeams = watch('maxTeams')
  const watchEntryFeeAmount = watch('entryFeeAmount')
  const watchRefundDeadlineDays = watch('refundDeadlineDays')
  const watchTeamLogoEnabled = watch('teamLogoEnabled')
  const watchShowRegistrants = watch('showRegistrants')
  const watchDonationEnabled = watch('donationEnabled')
  const watchDonationType = watch('donationType')
  const watchDonationFixedAmount = watch('donationFixedAmount')
  const watchDonationMinAmount = watch('donationMinAmount')

  // Auto-generate slug from title in create mode
  useEffect(() => {
    if (!isEditing && watchTitle) {
      setValue('slug', slugify(watchTitle))
    }
  }, [isEditing, watchTitle, setValue])

  // Reset payment fields when switching to FREE
  useEffect(() => {
    if (watchRegistrationType === RegistrationType.FREE) {
      setValue('entryFeeAmount', null)
      setValue('refundPolicyType', RefundPolicyType.NONE)
      setValue('refundDeadlineDays', null)
      setValue('donationEnabled', false)
      setValue('donationType', null)
      setValue('donationFixedAmount', null)
      setValue('donationMinAmount', null)
    }
  }, [watchRegistrationType, setValue])

  // Reset refund deadline when policy is NONE
  useEffect(() => {
    if (watchRefundPolicyType === RefundPolicyType.NONE) {
      setValue('refundDeadlineDays', null)
    }
  }, [watchRefundPolicyType, setValue])

  // Reset teamSize to 1 when format is SOLO
  useEffect(() => {
    if (watchFormat === TournamentFormat.SOLO) {
      setValue('teamSize', 1)
    }
  }, [watchFormat, setValue])

  const allowLeave = useUnsavedChanges(isDirty || mediaUploading)
  const sectionHasError = (fields: readonly string[]) =>
    fields.some(field => field in errors)
  // ─── Form submission ────────────────────────────────────────────────────────

  const isSubmitDisabled = isPending || isSubmitting || mediaUploading

  const onFormError = (fieldErrors: FieldErrors<TournamentFormValues>) => {
    const firstError = Object.values(fieldErrors).find(e => e?.message)
    const message =
      firstError?.message ?? 'Veuillez corriger les erreurs du formulaire.'
    toast.error(String(message))
    requestAnimationFrame(() => {
      const path = getFirstErrorPath(fieldErrors)
      const section = TOURNAMENT_FORM_SECTIONS.find(item =>
        item.fields.some(field => field === path?.split('.')[0]),
      )
      if (!section || !path) return
      const container = document.getElementById(`form-${section.id}`)
      container?.scrollIntoView({ block: 'start' })
      const invalidField =
        container?.querySelector<HTMLElement>(`[name="${CSS.escape(path)}"]`) ??
        document
          .getElementById(`tournament-${path}`)
          ?.querySelector<HTMLElement>('.ql-editor') ??
        container?.querySelector<HTMLElement>('[aria-invalid="true"]')
      invalidField?.focus({ preventScroll: true })
    })
  }

  const onSubmit = (data: TournamentFormValues) => {
    setActionError(null)
    const payload = {
      ...data,
      startDate: toISOFromLocal(data.startDate),
      endDate: toISOFromLocal(data.endDate),
      registrationOpen: toISOFromLocal(data.registrationOpen),
      registrationClose: toISOFromLocal(data.registrationClose),
      fields: data.fields.map((f, i) => ({ ...f, order: i })),
      toornamentStages: data.toornamentStages.map((s, i) => ({
        ...s,
        number: i,
      })),
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateTournament({ ...payload, id: tournament.id })
        : await createTournament(payload)

      if (result.success) {
        toast.success(result.message)
        allowLeave()
        reset()
        router.push(
          isEditing
            ? ROUTES.ADMIN_TOURNAMENT_DETAIL(data.slug)
            : ROUTES.ADMIN_TOURNAMENT_DETAIL(
                (result.data as { slug: string }).slug,
              ),
        )
      } else {
        setActionError(
          result.message ??
            'Une erreur est survenue. Vos modifications sont conservées.',
        )
      }
    })
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onFormError)}
      aria-busy={isPending}
      className="space-y-6"
    >
      <nav
        aria-label="Sections du formulaire"
        className="flex flex-wrap gap-2 rounded-2xl border border-white/15 bg-zinc-950/95 p-3"
      >
        {TOURNAMENT_FORM_SECTIONS.map(section => (
          <a
            key={section.id}
            href={`#form-${section.id}`}
            className={`rounded-lg border px-3 py-2 text-sm ${sectionHasError(section.fields) ? 'border-red-400/40 text-red-300' : 'border-white/10 text-zinc-300 hover:text-white'}`}
          >
            {section.label}
            {sectionHasError(section.fields) && (
              <span className="ml-1">• erreur</span>
            )}
          </a>
        ))}
      </nav>
      {Object.keys(errors).length > 0 && (
        <ActionFeedback tone="error" title="Le formulaire contient des erreurs">
          <p>
            Les sections concernées sont signalées dans le sommaire. Vos
            réponses sont conservées.
          </p>
        </ActionFeedback>
      )}
      {actionError && (
        <ActionFeedback tone="error" title="Enregistrement impossible">
          <p>{actionError}</p>
        </ActionFeedback>
      )}
      <section
        id="form-general"
        aria-label="Informations générales"
        className="section-anchor"
      >
        <TournamentFormGeneral
          register={register}
          control={control}
          errors={errors}
          setValue={setValue}
        />
      </section>

      <section id="form-games" aria-label="Jeux" className="section-anchor">
        <TournamentFormGames
          errors={errors}
          setValue={setValue}
          watch={watch}
        />
      </section>

      <section id="form-format" aria-label="Format" className="section-anchor">
        <TournamentFormFormat
          register={register}
          errors={errors}
          setValue={setValue}
          watchFormat={watchFormat}
          watchMaxTeams={watchMaxTeams}
          watchTeamLogoEnabled={watchTeamLogoEnabled}
          watchShowRegistrants={watchShowRegistrants}
          isEditing={isEditing}
        />
      </section>

      <section
        id="form-payment"
        aria-label="Paiement"
        className="section-anchor"
      >
        <TournamentFormPayment
          errors={errors}
          setValue={setValue}
          watchRegistrationType={watchRegistrationType}
          watchRefundPolicyType={watchRefundPolicyType}
          watchEntryFeeAmount={watchEntryFeeAmount}
          watchRefundDeadlineDays={watchRefundDeadlineDays}
          watchDonationEnabled={watchDonationEnabled ?? false}
          watchDonationType={watchDonationType}
          watchDonationFixedAmount={watchDonationFixedAmount}
          watchDonationMinAmount={watchDonationMinAmount}
          isEditing={isEditing}
        />
      </section>

      <section id="form-dates" aria-label="Dates" className="section-anchor">
        <TournamentFormDates control={control} errors={errors} />
      </section>

      <section id="form-images" aria-label="Médias" className="section-anchor">
        <TournamentFormImages
          onUploadingChange={setMediaUploading}
          register={register}
          errors={errors}
          setValue={setValue}
          watchImageUrls={watchImageUrls}
          watchSlug={watchSlug}
        />
      </section>

      <section
        id="form-content"
        aria-label="Contenu"
        className="section-anchor"
      >
        <TournamentFormContent
          control={control}
          errors={errors}
          setValue={setValue}
        />
      </section>

      <section id="form-fields" aria-label="Champs" className="section-anchor">
        <TournamentFormFields
          control={control}
          register={register}
          errors={errors}
          setValue={setValue}
          watch={watch}
          fieldsLocked={!!fieldsLocked}
        />
      </section>

      <section id="form-stages" aria-label="Phases" className="section-anchor">
        <TournamentFormStages
          control={control}
          register={register}
          errors={errors}
        />
      </section>

      {/* ── Submit ──────────────────────────────────────────────────────────── */}
      <div className="form-actions">
        <span className="mr-auto text-sm text-zinc-300" role="status">
          {isPending
            ? 'Enregistrement…'
            : isDirty
              ? 'Modifications non enregistrées'
              : 'Aucune modification en attente'}
        </span>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            if (isDirty) {
              setShowLeaveDialog(true)
            } else {
              router.push(ROUTES.ADMIN_TOURNAMENTS)
            }
          }}
          className="text-zinc-400"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitDisabled}
          className="gap-2 bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {isEditing ? 'Enregistrer' : 'Créer'}
        </Button>
      </div>

      {/* ── Unsaved changes dialog ─────────────────────────────────────────── */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non sauvegardées</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non sauvegardées. Voulez-vous vraiment
              quitter sans enregistrer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Rester</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                allowLeave()
                reset()
                router.push(ROUTES.ADMIN_TOURNAMENTS)
              }}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              Quitter sans enregistrer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}
