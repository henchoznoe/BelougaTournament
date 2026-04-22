/**
 * File: components/admin/tournaments/tournament-registration-row.tsx
 * Description: Registration table row with expandable fields and row action dropdown.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  ImageOff,
  Loader2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Trash2,
  Type,
  UserRound,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  ChangeTeamDialog,
  DeleteRegistrationDialog,
  EditFieldsDialog,
  RefundRegistrationDialog,
  RenameTeamDialog,
} from '@/components/admin/tournaments/tournament-registration-dialogs'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TableCell, TableRow } from '@/components/ui/table'
import { adminDeleteTeamLogo } from '@/lib/actions/registrations-team'
import { ROUTES } from '@/lib/config/routes'
import type {
  TeamItem,
  TournamentDetail,
  TournamentFieldItem,
  TournamentRegistrationItem,
} from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/formatting'
import { parseFieldValues } from '@/lib/utils/tournament-helpers'
import {
  PaymentStatus,
  RegistrationStatus,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

// ─── Constants ───────────────────────────────────────────────────────────────

const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  [RegistrationStatus.PENDING]: 'En attente',
  [RegistrationStatus.CONFIRMED]: 'Confirmée',
  [RegistrationStatus.CANCELLED]: 'Annulée',
  [RegistrationStatus.EXPIRED]: 'Expirée',
} as const

const REGISTRATION_STATUS_STYLES: Record<RegistrationStatus, string> = {
  [RegistrationStatus.PENDING]: 'bg-amber-500/10 text-amber-400',
  [RegistrationStatus.CONFIRMED]: 'bg-emerald-500/10 text-emerald-400',
  [RegistrationStatus.CANCELLED]: 'bg-red-500/10 text-red-400',
  [RegistrationStatus.EXPIRED]: 'bg-zinc-500/10 text-zinc-400',
} as const

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.NOT_REQUIRED]: 'Non requis',
  [PaymentStatus.UNPAID]: 'Non payé',
  [PaymentStatus.PENDING]: 'En attente',
  [PaymentStatus.PAID]: 'Payé',
  [PaymentStatus.FAILED]: 'Échoué',
  [PaymentStatus.REFUNDED]: 'Remboursé',
  [PaymentStatus.CANCELLED]: 'Annulé',
  [PaymentStatus.FORFEITED]: 'Donné',
} as const

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  [PaymentStatus.NOT_REQUIRED]: 'bg-zinc-500/10 text-zinc-400',
  [PaymentStatus.UNPAID]: 'bg-amber-500/10 text-amber-400',
  [PaymentStatus.PENDING]: 'bg-amber-500/10 text-amber-400',
  [PaymentStatus.PAID]: 'bg-emerald-500/10 text-emerald-400',
  [PaymentStatus.FAILED]: 'bg-red-500/10 text-red-400',
  [PaymentStatus.REFUNDED]: 'bg-blue-500/10 text-blue-400',
  [PaymentStatus.CANCELLED]: 'bg-zinc-500/10 text-zinc-400',
  [PaymentStatus.FORFEITED]: 'bg-orange-500/10 text-orange-400',
} as const

// ─── Registration Row Actions ────────────────────────────────────────────────

interface RowActionsProps {
  registration: TournamentRegistrationItem
  tournament: TournamentDetail
  teams: TeamItem[]
  fields: TournamentFieldItem[]
}

const RowActions = ({
  registration,
  tournament,
  teams,
  fields,
}: RowActionsProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editFieldsOpen, setEditFieldsOpen] = useState(false)
  const [changeTeamOpen, setChangeTeamOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [refundOpen, setRefundOpen] = useState(false)
  const [renameTeamOpen, setRenameTeamOpen] = useState(false)

  const isTeam = tournament.format === TournamentFormat.TEAM
  const canRefund = registration.paymentStatus === PaymentStatus.PAID

  const handleDeleteLogo = () => {
    const teamId = registration.team?.id
    if (!teamId) return
    startTransition(async () => {
      const result = await adminDeleteTeamLogo({ teamId })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="size-8 p-0"
            aria-label="Actions"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={ROUTES.ADMIN_USER_DETAIL(registration.user.id)}>
              <UserRound className="mr-2 size-4" />
              Voir le joueur
            </Link>
          </DropdownMenuItem>
          {fields.length > 0 && (
            <DropdownMenuItem onSelect={() => setEditFieldsOpen(true)}>
              <Pencil className="mr-2 size-4" />
              Modifier les champs
            </DropdownMenuItem>
          )}
          {isTeam && (
            <DropdownMenuItem onSelect={() => setChangeTeamOpen(true)}>
              <ArrowRightLeft className="mr-2 size-4" />
              Changer d\u2019équipe
            </DropdownMenuItem>
          )}
          {isTeam && registration.team && (
            <DropdownMenuItem onSelect={() => setRenameTeamOpen(true)}>
              <Type className="mr-2 size-4" />
              Renommer l\u2019équipe
            </DropdownMenuItem>
          )}
          {isTeam && registration.team?.logoUrl && (
            <DropdownMenuItem
              onSelect={handleDeleteLogo}
              className="text-amber-400 focus:text-amber-300"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ImageOff className="mr-2 size-4" />
              )}
              Supprimer le logo
            </DropdownMenuItem>
          )}
          {canRefund && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setRefundOpen(true)}
                className="text-blue-400 focus:text-blue-300"
              >
                <RefreshCw className="mr-2 size-4" />
                Rembourser
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            className="text-red-400 focus:text-red-300"
          >
            <Trash2 className="mr-2 size-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditFieldsDialog
        open={editFieldsOpen}
        onOpenChange={setEditFieldsOpen}
        registration={registration}
        fields={fields}
      />
      {isTeam && (
        <ChangeTeamDialog
          open={changeTeamOpen}
          onOpenChange={setChangeTeamOpen}
          registration={registration}
          teams={teams}
        />
      )}
      <DeleteRegistrationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        registration={registration}
      />
      <RefundRegistrationDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        registration={registration}
      />
      {isTeam && registration.team && (
        <RenameTeamDialog
          open={renameTeamOpen}
          onOpenChange={setRenameTeamOpen}
          registration={registration}
        />
      )}
    </>
  )
}

// ─── Registration Row ────────────────────────────────────────────────────────

interface RegistrationRowProps {
  registration: TournamentRegistrationItem
  tournament: TournamentDetail
  teams: TeamItem[]
  fields: TournamentFieldItem[]
  isTeam: boolean
  isPaid: boolean
  isExpanded: boolean
  hasFieldValues: boolean
  onToggleExpand: () => void
}

export const RegistrationRow = ({
  registration,
  tournament,
  teams,
  fields,
  isTeam,
  isPaid,
  isExpanded,
  hasFieldValues,
  onToggleExpand,
}: RegistrationRowProps) => {
  const displayName = registration.user.displayName || registration.user.name
  const fieldValues = parseFieldValues(registration.fieldValues)

  return (
    <>
      <TableRow className="border-white/5">
        <TableCell className="w-8">
          {hasFieldValues && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="rounded p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-300"
              aria-label={
                isExpanded ? 'Masquer les détails' : 'Afficher les détails'
              }
            >
              {isExpanded ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </button>
          )}
        </TableCell>
        <TableCell>
          <Link
            href={ROUTES.ADMIN_USER_DETAIL(registration.user.id)}
            className="flex items-center gap-2 transition-colors hover:text-blue-400"
          >
            {registration.user.image ? (
              <Image
                src={registration.user.image}
                alt={displayName}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="flex size-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-medium text-zinc-200">{displayName}</span>
          </Link>
        </TableCell>
        {isTeam && (
          <TableCell className="hidden md:table-cell">
            {registration.team ? (
              <div className="flex items-center gap-1.5">
                {registration.team.logoUrl && (
                  <div className="relative size-5 shrink-0 overflow-hidden rounded">
                    <Image
                      src={registration.team.logoUrl}
                      alt={`Logo ${registration.team.name}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <span className="text-sm text-zinc-300">
                  {registration.team.name}
                </span>
                {registration.team.captainId === registration.user.id && (
                  <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-400">
                    Cap.
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-zinc-600">—</span>
            )}
          </TableCell>
        )}
        <TableCell>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
              REGISTRATION_STATUS_STYLES[registration.status],
            )}
          >
            {REGISTRATION_STATUS_LABELS[registration.status]}
          </span>
        </TableCell>
        {isPaid && (
          <TableCell className="hidden sm:table-cell">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                PAYMENT_STATUS_STYLES[registration.paymentStatus],
              )}
            >
              {PAYMENT_STATUS_LABELS[registration.paymentStatus]}
            </span>
          </TableCell>
        )}
        <TableCell className="hidden text-sm text-zinc-400 lg:table-cell">
          {formatDate(registration.createdAt)}
        </TableCell>
        <TableCell className="w-10">
          <RowActions
            registration={registration}
            tournament={tournament}
            teams={teams}
            fields={fields}
          />
        </TableCell>
      </TableRow>

      {/* Expandable field values row */}
      {isExpanded && hasFieldValues && (
        <TableRow className="border-white/5 bg-white/2">
          <TableCell colSpan={isTeam && isPaid ? 7 : isTeam || isPaid ? 6 : 5}>
            <div className="grid gap-2 px-2 py-1 sm:grid-cols-2 lg:grid-cols-3">
              {fields.map(field => (
                <div
                  key={field.id}
                  className="flex items-baseline gap-2 text-sm"
                >
                  <span className="text-zinc-500">{field.label} :</span>
                  <span className="font-medium text-zinc-200">
                    {fieldValues[field.label] !== undefined &&
                    fieldValues[field.label] !== ''
                      ? String(fieldValues[field.label])
                      : '—'}
                  </span>
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
