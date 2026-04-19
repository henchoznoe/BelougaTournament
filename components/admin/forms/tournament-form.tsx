/**
 * File: components/admin/forms/tournament-form.tsx
 * Description: Main tournament form orchestrator for creating or editing a tournament.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { type FieldErrors, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { TournamentFormContent } from '@/components/admin/forms/tournament-form-content'
import { TournamentFormDates } from '@/components/admin/forms/tournament-form-dates'
import { TournamentFormEntry } from '@/components/admin/forms/tournament-form-entry'
import { TournamentFormFields } from '@/components/admin/forms/tournament-form-fields'
import { TournamentFormGame } from '@/components/admin/forms/tournament-form-game'
import { TournamentFormGeneral } from '@/components/admin/forms/tournament-form-general'
import { TournamentFormImages } from '@/components/admin/forms/tournament-form-images'
import { TournamentFormStages } from '@/components/admin/forms/tournament-form-stages'
import type { TournamentFormValues } from '@/components/admin/forms/tournament-form-types'
import { Button } from '@/components/ui/button'
import { createTournament, updateTournament } from '@/lib/actions/tournaments'
import { ROUTES } from '@/lib/config/routes'
import type { TournamentDetail } from '@/lib/types/tournament'
import { fromNullable } from '@/lib/utils/formatting'
import {
  tournamentSchema,
  updateTournamentSchema,
} from '@/lib/validations/tournaments'
import {
  type FieldType,
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
  const d = new Date(iso)
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Zurich',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return formatter.format(d).replace(' ', 'T')
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
      timeZone: 'Europe/Zurich',
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
    formState: { errors, isSubmitting },
  } = useForm<TournamentFormValues>({
    resolver: zodResolver(
      isEditing ? updateTournamentSchema : tournamentSchema,
      // biome-ignore lint/suspicious/noExplicitAny: union of create/update schemas; TournamentFormValues is the common subset
    ) as any,
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
      game: fromNullable(tournament?.game ?? null),
      rules: fromNullable(tournament?.rules ?? null),
      prize: fromNullable(tournament?.prize ?? null),
      registrationType: tournament?.registrationType ?? RegistrationType.FREE,
      entryFeeAmount: tournament?.entryFeeAmount ?? null,
      entryFeeCurrency: 'CHF',
      refundPolicyType: tournament?.refundPolicyType ?? RefundPolicyType.NONE,
      refundDeadlineDays: tournament?.refundDeadlineDays ?? null,
      toornamentId: fromNullable(tournament?.toornamentId ?? null),
      imageUrls: tournament?.imageUrls ?? [],
      streamUrl: fromNullable(tournament?.streamUrl ?? null),
      fields:
        tournament?.fields.map(f => ({
          id: f.id,
          label: f.label,
          type: f.type as FieldType,
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
  const watchFormat = watch('format')
  const watchRegistrationType = watch('registrationType')
  const watchRefundPolicyType = watch('refundPolicyType')
  const watchImageUrls = watch('imageUrls')
  const watchMaxTeams = watch('maxTeams')
  const watchEntryFeeAmount = watch('entryFeeAmount')
  const watchRefundDeadlineDays = watch('refundDeadlineDays')

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

  // ─── Form submission ────────────────────────────────────────────────────────

  const isSubmitDisabled = isPending || isSubmitting

  const onFormError = (fieldErrors: FieldErrors<TournamentFormValues>) => {
    const firstError = Object.values(fieldErrors).find(e => e?.message)
    const message =
      firstError?.message ?? 'Veuillez corriger les erreurs du formulaire.'
    toast.error(String(message))
  }

  const onSubmit = (data: TournamentFormValues) => {
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
        reset()
        router.push(
          isEditing
            ? ROUTES.ADMIN_TOURNAMENT_DETAIL(data.slug)
            : ROUTES.ADMIN_TOURNAMENTS,
        )
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)} className="space-y-6">
      <TournamentFormGeneral
        register={register}
        control={control}
        errors={errors}
        setValue={setValue}
        isEditing={isEditing}
      />

      <TournamentFormGame
        register={register}
        errors={errors}
        setValue={setValue}
        watchFormat={watchFormat}
        isEditing={isEditing}
      />

      <TournamentFormDates control={control} errors={errors} />

      <TournamentFormEntry
        errors={errors}
        setValue={setValue}
        watchRegistrationType={watchRegistrationType}
        watchRefundPolicyType={watchRefundPolicyType}
        watchMaxTeams={watchMaxTeams}
        watchEntryFeeAmount={watchEntryFeeAmount}
        watchRefundDeadlineDays={watchRefundDeadlineDays}
        isEditing={isEditing}
      />

      <TournamentFormImages
        register={register}
        errors={errors}
        setValue={setValue}
        watchImageUrls={watchImageUrls}
      />

      <TournamentFormContent
        control={control}
        errors={errors}
        setValue={setValue}
      />

      <TournamentFormFields
        control={control}
        register={register}
        errors={errors}
        setValue={setValue}
        watch={watch}
        fieldsLocked={!!fieldsLocked}
      />

      <TournamentFormStages
        control={control}
        register={register}
        errors={errors}
      />

      {/* ── Submit ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(ROUTES.ADMIN_TOURNAMENTS)}
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
    </form>
  )
}
