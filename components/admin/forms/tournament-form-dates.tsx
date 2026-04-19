/**
 * File: components/admin/forms/tournament-form-dates.tsx
 * Description: Dates section of the tournament form (start, end, registration open/close).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Calendar } from 'lucide-react'
import { type Control, Controller, type FieldErrors } from 'react-hook-form'
import type { TournamentFormValues } from '@/components/admin/forms/tournament-form-types'
import {
  INPUT_CLASSES,
  LABEL_CLASSES,
  SECTION_CLASSES,
  SectionHeader,
} from '@/components/admin/forms/tournament-form-ui'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Label } from '@/components/ui/label'

interface TournamentFormDatesProps {
  control: Control<TournamentFormValues>
  errors: FieldErrors<TournamentFormValues>
}

export const TournamentFormDates = ({
  control,
  errors,
}: TournamentFormDatesProps) => {
  return (
    <div className={SECTION_CLASSES}>
      <SectionHeader icon={Calendar} title="Dates" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tournament-startDate" className={LABEL_CLASSES}>
            Début du tournoi *
          </Label>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <DateTimePicker
                value={field.value}
                onChange={field.onChange}
                placeholder="Début du tournoi"
                className={`${INPUT_CLASSES} w-56`}
              />
            )}
          />
          {errors.startDate?.message && (
            <p className="text-xs text-red-400">{errors.startDate.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tournament-endDate" className={LABEL_CLASSES}>
            Fin du tournoi *
          </Label>
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <DateTimePicker
                value={field.value}
                onChange={field.onChange}
                placeholder="Fin du tournoi"
                className={`${INPUT_CLASSES} w-56`}
              />
            )}
          />
          {errors.endDate?.message && (
            <p className="text-xs text-red-400">{errors.endDate.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="tournament-registrationOpen"
            className={LABEL_CLASSES}
          >
            Ouverture des inscriptions *
          </Label>
          <Controller
            name="registrationOpen"
            control={control}
            render={({ field }) => (
              <DateTimePicker
                value={field.value}
                onChange={field.onChange}
                placeholder="Ouverture des inscriptions"
                className={`${INPUT_CLASSES} w-56`}
              />
            )}
          />
          {errors.registrationOpen?.message && (
            <p className="text-xs text-red-400">
              {errors.registrationOpen.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="tournament-registrationClose"
            className={LABEL_CLASSES}
          >
            Fermeture des inscriptions *
          </Label>
          <Controller
            name="registrationClose"
            control={control}
            render={({ field }) => (
              <DateTimePicker
                value={field.value}
                onChange={field.onChange}
                placeholder="Fermeture des inscriptions"
                className={`${INPUT_CLASSES} w-56`}
              />
            )}
          />
          {errors.registrationClose?.message && (
            <p className="text-xs text-red-400">
              {errors.registrationClose.message}
            </p>
          )}
        </div>
      </div>
      <p className="mt-3 text-[10px] text-zinc-600">
        Les heures sont en fuseau horaire suisse (Europe/Zurich) et converties
        automatiquement en UTC pour le stockage.
      </p>
    </div>
  )
}
