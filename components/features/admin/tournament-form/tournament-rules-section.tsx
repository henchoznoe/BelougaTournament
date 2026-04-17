/**
 * File: components/features/admin/tournament-form/tournament-rules-section.tsx
 * Description: Rules and prizes section of the tournament form.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { UseFormReturn } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { TournamentFormField } from '@/components/features/admin/tournament-form/tournament-form-field'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { TournamentFormInput } from '@/lib/validations/tournaments'
import {
  RefundPolicyType,
  RegistrationType,
} from '@/prisma/generated/prisma/enums'

interface TournamentRulesSectionProps {
  form: UseFormReturn<TournamentFormInput>
  isPending: boolean
  isEditing: boolean
}

export const TournamentRulesSection = ({
  form,
  isPending,
  isEditing,
}: TournamentRulesSectionProps) => {
  const {
    register,
    setValue,
    formState: { errors },
    control,
  } = form

  const registrationType = useWatch({ control, name: 'registrationType' })
  const refundPolicyType = useWatch({ control, name: 'refundPolicyType' })
  const isPaid = registrationType === RegistrationType.PAID

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-zinc-400">
            Type d'inscription
          </Label>
          <Select
            value={registrationType}
            onValueChange={value => {
              const nextValue = value as RegistrationType
              setValue('registrationType', nextValue, { shouldDirty: true })

              if (nextValue === RegistrationType.FREE) {
                setValue('entryFeeAmount', null, { shouldDirty: true })
                setValue('refundPolicyType', RefundPolicyType.NONE, {
                  shouldDirty: true,
                })
                setValue('refundDeadlineDays', null, { shouldDirty: true })
              } else {
                setValue('entryFeeCurrency', 'CHF', { shouldDirty: true })
                setValue(
                  'entryFeeAmount',
                  form.getValues('entryFeeAmount') ?? 500,
                  {
                    shouldDirty: true,
                  },
                )
                setValue('refundPolicyType', RefundPolicyType.BEFORE_DEADLINE, {
                  shouldDirty: true,
                })
                setValue(
                  'refundDeadlineDays',
                  form.getValues('refundDeadlineDays') ?? 14,
                  { shouldDirty: true },
                )
              }
            }}
            disabled={isPending || isEditing}
          >
            <SelectTrigger className="h-10 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={RegistrationType.FREE}>Gratuite</SelectItem>
              <SelectItem value={RegistrationType.PAID}>Payante</SelectItem>
            </SelectContent>
          </Select>
          {isEditing && (
            <p className="text-xs text-zinc-500">
              Le mode d'inscription et le prix ne peuvent pas être modifiés
              après la création.
            </p>
          )}
          {errors.registrationType?.message && (
            <p className="text-xs text-red-400">
              {errors.registrationType.message}
            </p>
          )}
        </div>

        <TournamentFormField
          id="entryFeeAmount"
          label="Prix d'entrée (centimes CHF)"
          type="number"
          placeholder="500"
          error={errors.entryFeeAmount?.message}
          disabled={isPending || !isPaid || isEditing}
          {...register('entryFeeAmount', {
            setValueAs: (value: string) =>
              value === '' || value === undefined ? null : Number(value),
          })}
        />
      </div>

      {isPaid && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-zinc-400">
              Politique de remboursement
            </Label>
            <Select
              value={refundPolicyType}
              onValueChange={value => {
                const nextValue = value as RefundPolicyType
                setValue('refundPolicyType', nextValue, { shouldDirty: true })
                setValue(
                  'refundDeadlineDays',
                  nextValue === RefundPolicyType.BEFORE_DEADLINE
                    ? (form.getValues('refundDeadlineDays') ?? 14)
                    : null,
                  { shouldDirty: true },
                )
              }}
              disabled={isPending || isEditing}
            >
              <SelectTrigger className="h-10 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={RefundPolicyType.BEFORE_DEADLINE}>
                  Remboursement avant délai
                </SelectItem>
                <SelectItem value={RefundPolicyType.NONE}>
                  Aucun remboursement auto
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.refundPolicyType?.message && (
              <p className="text-xs text-red-400">
                {errors.refundPolicyType.message}
              </p>
            )}
          </div>

          <TournamentFormField
            id="refundDeadlineDays"
            label="Délai remboursement (jours)"
            type="number"
            placeholder="14"
            error={errors.refundDeadlineDays?.message}
            disabled={
              isPending ||
              isEditing ||
              refundPolicyType !== RefundPolicyType.BEFORE_DEADLINE
            }
            {...register('refundDeadlineDays', {
              setValueAs: (value: string) =>
                value === '' || value === undefined ? null : Number(value),
            })}
          />
        </div>
      )}

      {isPaid && (
        <p className="text-xs text-zinc-500">
          V1 Stripe: `CHF` uniquement, paiement par joueur, remboursement
          automatique jusqu'à 14 jours avant le début.
        </p>
      )}
    </div>
  )
}
