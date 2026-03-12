/**
 * File: components/features/admin/tournament-form/tournament-dates-section.tsx
 * Description: Dates section (start, end, registration open/close) of the tournament form.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { UseFormReturn } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Label } from '@/components/ui/label'
import type { TournamentFormInput } from '@/lib/validations/tournaments'

interface TournamentDatesSectionProps {
  form: UseFormReturn<TournamentFormInput>
  isPending: boolean
}

export const TournamentDatesSection = ({
  form,
  isPending,
}: TournamentDatesSectionProps) => {
  const {
    control,
    formState: { errors },
  } = form

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
        Dates
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label
            htmlFor="startDate"
            className="text-xs font-medium text-zinc-400"
          >
            Date de début
          </Label>
          <Controller
            control={control}
            name="startDate"
            render={({ field }) => (
              <DateTimePicker
                value={field.value}
                onChange={field.onChange}
                disabled={isPending}
                placeholder="Date de début"
              />
            )}
          />
          {errors.startDate?.message && (
            <p className="text-xs text-red-400">{errors.startDate.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="endDate"
            className="text-xs font-medium text-zinc-400"
          >
            Date de fin
          </Label>
          <Controller
            control={control}
            name="endDate"
            render={({ field }) => (
              <DateTimePicker
                value={field.value}
                onChange={field.onChange}
                disabled={isPending}
                placeholder="Date de fin"
              />
            )}
          />
          {errors.endDate?.message && (
            <p className="text-xs text-red-400">{errors.endDate.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="registrationOpen"
            className="text-xs font-medium text-zinc-400"
          >
            Ouverture des inscriptions
          </Label>
          <Controller
            control={control}
            name="registrationOpen"
            render={({ field }) => (
              <DateTimePicker
                value={field.value}
                onChange={field.onChange}
                disabled={isPending}
                placeholder="Ouverture des inscriptions"
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
            htmlFor="registrationClose"
            className="text-xs font-medium text-zinc-400"
          >
            Fermeture des inscriptions
          </Label>
          <Controller
            control={control}
            name="registrationClose"
            render={({ field }) => (
              <DateTimePicker
                value={field.value}
                onChange={field.onChange}
                disabled={isPending}
                placeholder="Fermeture des inscriptions"
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
