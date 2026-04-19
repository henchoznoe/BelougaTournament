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
  EditFieldsDialog,
} from '@/components/admin/tournaments/tournament-registration-dialogs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  adminDeleteRegistration,
  adminRefundRegistration,
} from '@/lib/actions/registrations'
import {
  adminDeleteTeamLogo,
  adminUpdateTeamName,
} from '@/lib/actions/registrations-team'
import { VALIDATION_LIMITS } from '@/lib/config/constants'
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
} as const

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  [PaymentStatus.NOT_REQUIRED]: 'bg-zinc-500/10 text-zinc-400',
  [PaymentStatus.UNPAID]: 'bg-amber-500/10 text-amber-400',
  [PaymentStatus.PENDING]: 'bg-amber-500/10 text-amber-400',
  [PaymentStatus.PAID]: 'bg-emerald-500/10 text-emerald-400',
  [PaymentStatus.FAILED]: 'bg-red-500/10 text-red-400',
  [PaymentStatus.REFUNDED]: 'bg-blue-500/10 text-blue-400',
  [PaymentStatus.CANCELLED]: 'bg-zinc-500/10 text-zinc-400',
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
  const [newTeamName, setNewTeamName] = useState(registration.team?.name ?? '')

  const isTeam = tournament.format === TournamentFormat.TEAM
  const canRefund = registration.paymentStatus === PaymentStatus.PAID

  const handleDelete = () => {
    startTransition(async () => {
      const result = await adminDeleteRegistration({
        registrationId: registration.id,
      })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setDeleteOpen(false)
    })
  }

  const handleRefund = () => {
    startTransition(async () => {
      const result = await adminRefundRegistration({
        registrationId: registration.id,
      })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setRefundOpen(false)
    })
  }

  const handleRenameTeam = () => {
    const teamId = registration.team?.id
    if (!teamId) return
    startTransition(async () => {
      const result = await adminUpdateTeamName({
        teamId,
        name: newTeamName.trim(),
      })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setRenameTeamOpen(false)
    })
  }

  const handleDeleteLogo = () => {
    const teamId = registration.team?.id
    if (!teamId) return
    startTransition(async () => {
      const result = await adminDeleteTeamLogo({
        teamId,
      })
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
              Changer d'équipe
            </DropdownMenuItem>
          )}
          {isTeam && registration.team && (
            <DropdownMenuItem
              onSelect={() => {
                setNewTeamName(registration.team?.name ?? '')
                setRenameTeamOpen(true)
              }}
            >
              <Type className="mr-2 size-4" />
              Renommer l'équipe
            </DropdownMenuItem>
          )}
          {isTeam && registration.team?.logoUrl && (
            <DropdownMenuItem
              onSelect={handleDeleteLogo}
              className="text-amber-400 focus:text-amber-300"
            >
              <ImageOff className="mr-2 size-4" />
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

      {/* Edit fields dialog */}
      <EditFieldsDialog
        open={editFieldsOpen}
        onOpenChange={setEditFieldsOpen}
        registration={registration}
        fields={fields}
      />

      {/* Change team dialog */}
      {isTeam && (
        <ChangeTeamDialog
          open={changeTeamOpen}
          onOpenChange={setChangeTeamOpen}
          registration={registration}
          teams={teams}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer l'inscription de{' '}
              {registration.user.displayName || registration.user.name} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera l'inscription.
              {registration.team && ' Le joueur sera retiré de son équipe.'}
              {registration.paymentStatus === PaymentStatus.PAID && (
                <>
                  {' '}
                  <span className="font-semibold text-amber-400">
                    Attention : le paiement ne sera pas automatiquement
                    remboursé.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund confirmation */}
      <AlertDialog open={refundOpen} onOpenChange={setRefundOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Rembourser{' '}
              {registration.user.displayName || registration.user.name} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Un remboursement Stripe sera initié pour cette inscription. Le
              joueur sera désinscrit et retiré de son équipe le cas échéant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefund} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Rembourser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename team dialog */}
      {isTeam && registration.team && (
        <Dialog open={renameTeamOpen} onOpenChange={setRenameTeamOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renommer l'équipe</DialogTitle>
              <DialogDescription>
                Équipe actuelle : {registration.team.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="admin-rename-team" className="text-sm">
                Nouveau nom
              </Label>
              <Input
                id="admin-rename-team"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                maxLength={VALIDATION_LIMITS.TEAM_NAME_MAX}
                disabled={isPending}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRenameTeamOpen(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button
                onClick={handleRenameTeam}
                disabled={
                  isPending ||
                  newTeamName.trim().length < VALIDATION_LIMITS.TEAM_NAME_MIN ||
                  newTeamName.trim() === registration.team.name
                }
              >
                {isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Renommer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
