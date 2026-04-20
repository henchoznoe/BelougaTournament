/**
 * File: components/admin/tournaments/form/tournament-form-payment.tsx
 * Description: Payment and refund section of the tournament form (registration type, entry fee, refund policy).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { CreditCard } from 'lucide-react'
import type { FieldErrors, UseFormSetValue } from 'react-hook-form'
import type { TournamentFormValues } from '@/components/admin/tournaments/form/tournament-form-types'
import {
  INPUT_CLASSES,
  LABEL_CLASSES,
  LockedIndicator,
  SECTION_CLASSES,
  SectionHeader,
} from '@/components/admin/tournaments/form/tournament-form-ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VALIDATION_LIMITS } from '@/lib/config/constants'
import { cn } from '@/lib/utils/cn'
import {
  calculateStripeNetAmount,
  formatCentimes,
  parseCentimes,
} from '@/lib/utils/formatting'
import {
  RefundPolicyType,
  RegistrationType,
} from '@/prisma/generated/prisma/enums'

const isRefundPolicyType = (val: string): val is RefundPolicyType =>
  (Object.values(RefundPolicyType) as string[]).includes(val)

interface TournamentFormPaymentProps {
  errors: FieldErrors<TournamentFormValues>
  setValue: UseFormSetValue<TournamentFormValues>
  watchRegistrationType: RegistrationType
  watchRefundPolicyType: RefundPolicyType
  watchEntryFeeAmount: number | null
  watchRefundDeadlineDays: number | null
  isEditing: boolean
}

export const TournamentFormPayment = ({
  errors,
  setValue,
  watchRegistrationType,
  watchRefundPolicyType,
  watchEntryFeeAmount,
  watchRefundDeadlineDays,
  isEditing,
}: TournamentFormPaymentProps) => {
  const isPaid = watchRegistrationType === RegistrationType.PAID

  return (
    <div className={SECTION_CLASSES}>
      <SectionHeader icon={CreditCard} title="Type d'inscription" />
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          {/* Registration Type */}
          <div className="space-y-1.5">
            <Label
              htmlFor="tournament-registrationType"
              className={LABEL_CLASSES}
            >
              Type d&apos;inscription * {isEditing && <LockedIndicator />}
            </Label>
            <Select
              value={watchRegistrationType}
              onValueChange={val => {
                if (
                  val === RegistrationType.FREE ||
                  val === RegistrationType.PAID
                ) {
                  setValue('registrationType', val, { shouldValidate: true })
                }
              }}
              disabled={isEditing}
            >
              <SelectTrigger
                id="tournament-registrationType"
                className={cn(
                  INPUT_CLASSES,
                  'w-full',
                  isEditing && 'opacity-60',
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={RegistrationType.FREE}>Gratuit</SelectItem>
                <SelectItem value={RegistrationType.PAID}>Payant</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500">
              Le type d&apos;inscription ne peut pas être modifié après la
              création du tournoi.
            </p>
            {errors.registrationType?.message && (
              <p className="text-xs text-red-400">
                {errors.registrationType.message}
              </p>
            )}
          </div>

          {/* Entry Fee */}
          {isPaid && (
            <div className="space-y-1.5">
              <Label
                htmlFor="tournament-entryFeeAmount"
                className={LABEL_CLASSES}
              >
                Prix d&apos;entrée (CHF) * {isEditing && <LockedIndicator />}
              </Label>
              <Input
                id="tournament-entryFeeAmount"
                type="number"
                min={1}
                step={0.01}
                placeholder="5.00"
                disabled={isEditing}
                className={cn(
                  INPUT_CLASSES,
                  'flex-1',
                  isEditing && 'opacity-60',
                )}
                value={
                  watchEntryFeeAmount !== null
                    ? formatCentimes(watchEntryFeeAmount).split(' ')[0]
                    : ''
                }
                onChange={e => {
                  const val =
                    e.target.value === ''
                      ? null
                      : parseCentimes(Number(e.target.value))
                  setValue('entryFeeAmount', val, { shouldValidate: true })
                }}
              />
              {errors.entryFeeAmount?.message && (
                <p className="text-xs text-red-400">
                  {errors.entryFeeAmount.message}
                </p>
              )}
              <p className="text-xs text-zinc-500">
                Le prix d&apos;entrée ne peut pas être modifié après la création
                du tournoi. Les frais de transaction de Stripe s&apos;appliquent
                sur chaque transaction et s&apos;élèvent à 2.9% + 0.30 CHF. Pour
                le montant sélectionné, vous recevrez pour chaque inscription{' '}
                <b className="text-red-400 underline">
                  {watchEntryFeeAmount !== null
                    ? `${formatCentimes(calculateStripeNetAmount(watchEntryFeeAmount))}`
                    : 'X CHF'}
                </b>
                .
              </p>
            </div>
          )}
        </div>

        {/* Refund policy (only for paid) */}
        {isPaid && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="tournament-refundPolicyType"
                className={LABEL_CLASSES}
              >
                Politique de remboursement * {isEditing && <LockedIndicator />}
              </Label>
              <Select
                value={watchRefundPolicyType}
                onValueChange={val => {
                  if (isRefundPolicyType(val))
                    setValue('refundPolicyType', val, { shouldValidate: true })
                }}
                disabled={isEditing}
              >
                <SelectTrigger
                  id="tournament-refundPolicyType"
                  className={cn(
                    INPUT_CLASSES,
                    'w-full',
                    isEditing && 'opacity-60',
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RefundPolicyType.NONE}>
                    Aucun remboursement
                  </SelectItem>
                  <SelectItem value={RefundPolicyType.BEFORE_DEADLINE}>
                    Remboursement avant le délai
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-zinc-500">
                La politique de remboursement ne peut pas être modifiée après la
                création du tournoi.
              </p>
              {errors.refundPolicyType?.message && (
                <p className="text-xs text-red-400">
                  {errors.refundPolicyType.message}
                </p>
              )}
            </div>
            {watchRefundPolicyType === RefundPolicyType.BEFORE_DEADLINE && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="tournament-refundDeadlineDays"
                  className={LABEL_CLASSES}
                >
                  Délai * {isEditing && <LockedIndicator />}
                </Label>
                <Input
                  id="tournament-refundDeadlineDays"
                  type="number"
                  min={VALIDATION_LIMITS.REFUND_DEADLINE_MIN_DAYS}
                  max={VALIDATION_LIMITS.REFUND_DEADLINE_MAX_DAYS}
                  disabled={isEditing}
                  className={cn(
                    INPUT_CLASSES,
                    'w-full',
                    isEditing && 'opacity-60',
                  )}
                  value={watchRefundDeadlineDays ?? ''}
                  onChange={e => {
                    const val =
                      e.target.value === '' ? null : Number(e.target.value)
                    setValue('refundDeadlineDays', val, {
                      shouldValidate: true,
                    })
                  }}
                />
                {errors.refundDeadlineDays?.message && (
                  <p className="text-xs text-red-400">
                    {errors.refundDeadlineDays.message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        {watchRegistrationType === RegistrationType.PAID &&
          watchRefundPolicyType === RefundPolicyType.BEFORE_DEADLINE && (
            <p className="text-xs text-zinc-500">
              La sélection actuelle précise que les joueurs peuvent se retirer
              du tournoi et demander un remboursement s'ils se retirent{' '}
              <b className="text-red-400 underline">
                {watchRefundDeadlineDays ?? 'X'}
              </b>{' '}
              jours avant le début du tournoi. Le montant remboursé sera de{' '}
              <b className="text-red-400 underline">
                {watchEntryFeeAmount !== null
                  ? formatCentimes(
                      calculateStripeNetAmount(watchEntryFeeAmount),
                    )
                  : 'X CHF'}
              </b>{' '}
              (frais Stripe déduits).
            </p>
          )}
        {watchRegistrationType === RegistrationType.PAID &&
          watchRefundPolicyType === RefundPolicyType.NONE && (
            <p className="text-xs text-zinc-500">
              La sélection actuelle précise qu&apos;aucun remboursement ne sera
              accordé aux joueurs qui se retirent du tournoi.
            </p>
          )}
      </div>
    </div>
  )
}
