/**
 * File: components/admin/tournaments/form/tournament-form-dates.tsx
 * Description: Dates section of the tournament form (start, end, registration open/close).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Calendar } from 'lucide-react'
import { type Control, Controller, type FieldErrors } from 'react-hook-form'
import {
  INPUT_CLASSES,
  LABEL_CLASSES,
  SECTION_CLASSES,
  SectionHeader,
} from '@/components/admin/tournaments/form/tournament-form-ui'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Label } from '@/components/ui/label'
import type { TournamentFormValues } from '@/lib/types/tournament-form'

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
                className={`${INPUT_CLASSES} w-full`}
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
                className={`${INPUT_CLASSES} w-full`}
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
                className={`${INPUT_CLASSES} w-full`}
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
                className={`${INPUT_CLASSES} w-full`}
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
    </div>
  )
}
