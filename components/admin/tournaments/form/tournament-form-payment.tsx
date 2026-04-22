/**
 * File: components/admin/tournaments/form/tournament-form-payment.tsx
 * Description: Payment and refund section of the tournament form (registration type, entry fee, refund policy, optional donation).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { CreditCard } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FieldErrors, UseFormSetValue } from 'react-hook-form'
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
import { Switch } from '@/components/ui/switch'
import { VALIDATION_LIMITS } from '@/lib/config/constants'
import type { TournamentFormValues } from '@/lib/types/tournament-form'
import { cn } from '@/lib/utils/cn'
import {
  calculateStripeNetAmount,
  formatCentimes,
  parseCentimes,
} from '@/lib/utils/formatting'
import {
  DonationType,
  RefundPolicyType,
  RegistrationType,
} from '@/prisma/generated/prisma/enums'

const isRefundPolicyType = (val: string): val is RefundPolicyType =>
  (Object.values(RefundPolicyType) as string[]).includes(val)

const isDonationType = (val: string): val is DonationType =>
  (Object.values(DonationType) as string[]).includes(val)

interface TournamentFormPaymentProps {
  errors: FieldErrors<TournamentFormValues>
  setValue: UseFormSetValue<TournamentFormValues>
  watchRegistrationType: RegistrationType
  watchRefundPolicyType: RefundPolicyType
  watchEntryFeeAmount: number | null
  watchRefundDeadlineDays: number | null
  watchDonationEnabled: boolean
  watchDonationType: DonationType | null | undefined
  watchDonationFixedAmount: number | null | undefined
  watchDonationMinAmount: number | null | undefined
  isEditing: boolean
}

export const TournamentFormPayment = ({
  errors,
  setValue,
  watchRegistrationType,
  watchRefundPolicyType,
  watchEntryFeeAmount,
  watchRefundDeadlineDays,
  watchDonationEnabled,
  watchDonationType,
  watchDonationFixedAmount,
  watchDonationMinAmount,
  isEditing,
}: TournamentFormPaymentProps) => {
  const isPaid = watchRegistrationType === RegistrationType.PAID

  // Local string state for the entry fee input to avoid cursor-jumping
  // caused by re-converting centimes → decimal on every keystroke.
  const [feeInput, setFeeInput] = useState<string>(
    watchEntryFeeAmount !== null
      ? formatCentimes(watchEntryFeeAmount).split(' ')[0]
      : '',
  )

  // Local string states for donation amount inputs
  const [donationFixedInput, setDonationFixedInput] = useState<string>(
    watchDonationFixedAmount != null
      ? formatCentimes(watchDonationFixedAmount).split(' ')[0]
      : '',
  )
  const [donationMinInput, setDonationMinInput] = useState<string>(
    watchDonationMinAmount != null
      ? formatCentimes(watchDonationMinAmount).split(' ')[0]
      : '',
  )

  // Sync the local input only when the external value diverges from what the
  // user typed (e.g. form reset or programmatic setValue), so that mid-typing
  // ("1" → 100 centimes → "1.00") does NOT overwrite the raw input.
  useEffect(() => {
    const currentParsed =
      feeInput === ''
        ? null
        : (() => {
            const parsed = Number.parseFloat(feeInput.replace(',', '.'))
            return Number.isNaN(parsed) || parsed <= 0
              ? null
              : parseCentimes(parsed)
          })()
    if (currentParsed !== watchEntryFeeAmount) {
      setFeeInput(
        watchEntryFeeAmount !== null
          ? formatCentimes(watchEntryFeeAmount).split(' ')[0]
          : '',
      )
    }
  }, [watchEntryFeeAmount, feeInput])

  // Sync donation fixed amount input
  useEffect(() => {
    const currentParsed =
      donationFixedInput === ''
        ? null
        : (() => {
            const parsed = Number.parseFloat(
              donationFixedInput.replace(',', '.'),
            )
            return Number.isNaN(parsed) || parsed <= 0
              ? null
              : parseCentimes(parsed)
          })()
    const target = watchDonationFixedAmount ?? null
    if (currentParsed !== target) {
      setDonationFixedInput(
        target !== null ? formatCentimes(target).split(' ')[0] : '',
      )
    }
  }, [watchDonationFixedAmount, donationFixedInput])

  // Sync donation min amount input
  useEffect(() => {
    const currentParsed =
      donationMinInput === ''
        ? null
        : (() => {
            const parsed = Number.parseFloat(donationMinInput.replace(',', '.'))
            return Number.isNaN(parsed) || parsed <= 0
              ? null
              : parseCentimes(parsed)
          })()
    const target = watchDonationMinAmount ?? null
    if (currentParsed !== target) {
      setDonationMinInput(
        target !== null ? formatCentimes(target).split(' ')[0] : '',
      )
    }
  }, [watchDonationMinAmount, donationMinInput])

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
                type="text"
                inputMode="decimal"
                placeholder="5.00"
                disabled={isEditing}
                className={cn(
                  INPUT_CLASSES,
                  'flex-1',
                  isEditing && 'opacity-60',
                )}
                value={feeInput}
                onChange={e => {
                  const raw = e.target.value
                  // Allow only digits, one dot or comma, up to 2 decimal places
                  if (raw !== '' && !/^\d*[.,]?\d{0,2}$/.test(raw)) return
                  setFeeInput(raw)
                  const normalized = raw.replace(',', '.')
                  const parsed = Number.parseFloat(normalized)
                  const val =
                    raw === '' || Number.isNaN(parsed) || parsed <= 0
                      ? null
                      : parseCentimes(parsed)
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

        {/* Donation section (only for paid tournaments) */}
        {isPaid && (
          <div className="space-y-4 border-t border-zinc-800 pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="tournament-donationEnabled"
                  className={LABEL_CLASSES}
                >
                  Don optionnel
                </Label>
                <p className="text-xs text-zinc-500">
                  Proposer aux joueurs d&apos;ajouter un don lors de leur
                  inscription.
                </p>
              </div>
              <Switch
                id="tournament-donationEnabled"
                checked={watchDonationEnabled}
                onCheckedChange={checked => {
                  setValue('donationEnabled', checked, { shouldValidate: true })
                  if (!checked) {
                    setValue('donationType', null, { shouldValidate: true })
                    setValue('donationFixedAmount', null, {
                      shouldValidate: true,
                    })
                    setValue('donationMinAmount', null, {
                      shouldValidate: true,
                    })
                  }
                }}
              />
            </div>
            {errors.donationEnabled?.message && (
              <p className="text-xs text-red-400">
                {errors.donationEnabled.message}
              </p>
            )}

            {watchDonationEnabled && (
              <div className="space-y-4">
                {/* Donation Type */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="tournament-donationType"
                    className={LABEL_CLASSES}
                  >
                    Type de don *
                  </Label>
                  <Select
                    value={watchDonationType ?? ''}
                    onValueChange={val => {
                      if (isDonationType(val)) {
                        setValue('donationType', val, { shouldValidate: true })
                        setValue('donationFixedAmount', null, {
                          shouldValidate: true,
                        })
                        setValue('donationMinAmount', null, {
                          shouldValidate: true,
                        })
                      }
                    }}
                  >
                    <SelectTrigger
                      id="tournament-donationType"
                      className={cn(INPUT_CLASSES, 'w-full')}
                    >
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DonationType.FIXED}>
                        Montant fixe
                      </SelectItem>
                      <SelectItem value={DonationType.FREE}>
                        Montant libre
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.donationType?.message && (
                    <p className="text-xs text-red-400">
                      {errors.donationType.message}
                    </p>
                  )}
                </div>

                {/* Fixed donation amount */}
                {watchDonationType === DonationType.FIXED && (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="tournament-donationFixedAmount"
                      className={LABEL_CLASSES}
                    >
                      Montant du don (CHF) *
                    </Label>
                    <Input
                      id="tournament-donationFixedAmount"
                      type="text"
                      inputMode="decimal"
                      placeholder="5.00"
                      className={cn(INPUT_CLASSES, 'flex-1')}
                      value={donationFixedInput}
                      onChange={e => {
                        const raw = e.target.value
                        if (raw !== '' && !/^\d*[.,]?\d{0,2}$/.test(raw)) return
                        setDonationFixedInput(raw)
                        const normalized = raw.replace(',', '.')
                        const parsed = Number.parseFloat(normalized)
                        const val =
                          raw === '' || Number.isNaN(parsed) || parsed <= 0
                            ? null
                            : parseCentimes(parsed)
                        setValue('donationFixedAmount', val, {
                          shouldValidate: true,
                        })
                      }}
                    />
                    {errors.donationFixedAmount?.message && (
                      <p className="text-xs text-red-400">
                        {errors.donationFixedAmount.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Free donation minimum amount */}
                {watchDonationType === DonationType.FREE && (
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="tournament-donationMinAmount"
                      className={LABEL_CLASSES}
                    >
                      Montant minimum du don (CHF) *
                    </Label>
                    <Input
                      id="tournament-donationMinAmount"
                      type="text"
                      inputMode="decimal"
                      placeholder="1.00"
                      className={cn(INPUT_CLASSES, 'flex-1')}
                      value={donationMinInput}
                      onChange={e => {
                        const raw = e.target.value
                        if (raw !== '' && !/^\d*[.,]?\d{0,2}$/.test(raw)) return
                        setDonationMinInput(raw)
                        const normalized = raw.replace(',', '.')
                        const parsed = Number.parseFloat(normalized)
                        const val =
                          raw === '' || Number.isNaN(parsed) || parsed <= 0
                            ? null
                            : parseCentimes(parsed)
                        setValue('donationMinAmount', val, {
                          shouldValidate: true,
                        })
                      }}
                    />
                    {errors.donationMinAmount?.message && (
                      <p className="text-xs text-red-400">
                        {errors.donationMinAmount.message}
                      </p>
                    )}
                  </div>
                )}

                <p className="text-xs text-amber-400">
                  Le don n&apos;est jamais remboursé, même en cas de désistement
                  du joueur.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
