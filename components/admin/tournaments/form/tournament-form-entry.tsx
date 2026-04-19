/**
 * File: components/admin/tournaments/form/tournament-form-entry.tsx
 * Description: Registration and payment section of the tournament form.
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
import { Switch } from '@/components/ui/switch'
import { VALIDATION_LIMITS } from '@/lib/config/constants'
import { cn } from '@/lib/utils/cn'
import { formatCentimes, parseCentimes } from '@/lib/utils/formatting'
import {
  RefundPolicyType,
  RegistrationType,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

const isRefundPolicyType = (val: string): val is RefundPolicyType =>
  Object.values(RefundPolicyType).includes(val as RefundPolicyType)

interface TournamentFormEntryProps {
  errors: FieldErrors<TournamentFormValues>
  setValue: UseFormSetValue<TournamentFormValues>
  watchRegistrationType: RegistrationType
  watchRefundPolicyType: RefundPolicyType
  watchMaxTeams: number | null
  watchEntryFeeAmount: number | null
  watchRefundDeadlineDays: number | null
  watchFormat: TournamentFormat
  watchTeamLogoEnabled: boolean
  isEditing: boolean
}

export const TournamentFormEntry = ({
  errors,
  setValue,
  watchRegistrationType,
  watchRefundPolicyType,
  watchMaxTeams,
  watchEntryFeeAmount,
  watchRefundDeadlineDays,
  watchFormat,
  watchTeamLogoEnabled,
  isEditing,
}: TournamentFormEntryProps) => {
  const isPaid = watchRegistrationType === RegistrationType.PAID

  return (
    <div className={SECTION_CLASSES}>
      <SectionHeader icon={CreditCard} title="Inscription et paiement" />
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Max Teams */}
          <div className="space-y-1.5">
            <Label htmlFor="tournament-maxTeams" className={LABEL_CLASSES}>
              Nombre max. de places
            </Label>
            <Input
              id="tournament-maxTeams"
              type="number"
              min={2}
              placeholder="Illimité"
              className={INPUT_CLASSES}
              value={watchMaxTeams ?? ''}
              onChange={e => {
                const val =
                  e.target.value === '' ? null : Number(e.target.value)
                setValue('maxTeams', val, { shouldValidate: true })
              }}
            />
            {errors.maxTeams?.message && (
              <p className="text-xs text-red-400">{errors.maxTeams.message}</p>
            )}
            <p className="text-xs text-zinc-500">
              En solo : nombre de joueurs. En équipe : nombre d&apos;équipes
              (ex. 4 pour un 5v5 avec 4 équipes).
            </p>
          </div>

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
              <div className="flex items-center gap-2">
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
                <span className="text-xs font-medium text-zinc-500">CHF</span>
              </div>
              {errors.entryFeeAmount?.message && (
                <p className="text-xs text-red-400">
                  {errors.entryFeeAmount.message}
                </p>
              )}
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
                Politique de remboursement {isEditing && <LockedIndicator />}
              </Label>
              <Select
                value={watchRefundPolicyType}
                onValueChange={val => {
                  if (isRefundPolicyType(val))
                    setValue('refundPolicyType', val, {
                      shouldValidate: true,
                    })
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
                    Avant délai
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.refundPolicyType?.message && (
                <p className="text-xs text-red-400">
                  {errors.refundPolicyType.message}
                </p>
              )}
              {watchRefundPolicyType === RefundPolicyType.BEFORE_DEADLINE && (
                <p className="text-xs text-zinc-500">
                  Les joueurs peuvent demander un remboursement jusqu&apos;à X
                  jours avant le début du tournoi.
                </p>
              )}
            </div>

            {watchRefundPolicyType === RefundPolicyType.BEFORE_DEADLINE && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="tournament-refundDeadlineDays"
                  className={LABEL_CLASSES}
                >
                  Délai (jours avant début) * {isEditing && <LockedIndicator />}
                </Label>
                <Input
                  id="tournament-refundDeadlineDays"
                  type="number"
                  min={VALIDATION_LIMITS.REFUND_DEADLINE_MIN_DAYS}
                  max={VALIDATION_LIMITS.REFUND_DEADLINE_MAX_DAYS}
                  disabled={isEditing}
                  className={cn(
                    INPUT_CLASSES,
                    'w-32',
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

        {/* Team logo toggle (only for team format) */}
        {watchFormat === TournamentFormat.TEAM && (
          <div className="flex items-center gap-3">
            <Switch
              id="tournament-teamLogoEnabled"
              checked={watchTeamLogoEnabled}
              onCheckedChange={val =>
                setValue('teamLogoEnabled', val, { shouldValidate: true })
              }
            />
            <Label
              htmlFor="tournament-teamLogoEnabled"
              className="cursor-pointer text-sm text-zinc-300"
            >
              Autoriser les capitaines à uploader un logo d&apos;équipe
            </Label>
          </div>
        )}
      </div>
    </div>
  )
}
