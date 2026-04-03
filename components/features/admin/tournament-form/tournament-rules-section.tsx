/**
 * File: components/features/admin/tournament-form/tournament-rules-section.tsx
 * Description: Rules and prizes section of the tournament form.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { UseFormReturn } from 'react-hook-form'
import { TournamentFormField } from '@/components/features/admin/tournament-form/tournament-form-field'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { TournamentFormInput } from '@/lib/validations/tournaments'

interface TournamentRulesSectionProps {
  form: UseFormReturn<TournamentFormInput>
  isPending: boolean
}

export const TournamentRulesSection = ({
  form,
  isPending,
}: TournamentRulesSectionProps) => {
  const {
    register,
    formState: { errors },
  } = form

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
        Règlement & prix
      </h3>
      <div className="space-y-1.5">
        <Label htmlFor="rules" className="text-xs font-medium text-zinc-400">
          Règlement
        </Label>
        <Textarea
          id="rules"
          placeholder="Décrivez les règles du tournoi..."
          disabled={isPending}
          className="min-h-32 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20"
          {...register('rules')}
        />
        {errors.rules?.message && (
          <p className="text-xs text-red-400">{errors.rules.message}</p>
        )}
      </div>
      <TournamentFormField
        id="prize"
        label="Prix"
        placeholder="1er: 100€, 2ème: 50€"
        error={errors.prize?.message}
        disabled={isPending}
        {...register('prize')}
      />
    </div>
  )
}
