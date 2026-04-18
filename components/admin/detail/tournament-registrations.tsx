/**
 * File: components/admin/detail/tournament-registrations.tsx
 * Description: Admin registrations table with filters, expandable field values, and row actions.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Loader2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  adminChangeTeam,
  adminDeleteRegistration,
  adminRefundRegistration,
  adminUpdateRegistrationFields,
} from '@/lib/actions/registrations'
import { ROUTES } from '@/lib/config/routes'
import type {
  TeamItem,
  TournamentDetail,
  TournamentFieldItem,
  TournamentRegistrationItem,
} from '@/lib/types/tournament'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/formatting'
import {
  PaymentStatus,
  RegistrationStatus,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

// ─── Constants ───────────────────────────────────────────────────────────────

const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  [RegistrationStatus.PENDING]: 'En attente',
  [RegistrationStatus.CONFIRMED]: 'Confirm\u00e9',
  [RegistrationStatus.CANCELLED]: 'Annul\u00e9',
  [RegistrationStatus.EXPIRED]: 'Expir\u00e9',
} as const

const REGISTRATION_STATUS_STYLES: Record<RegistrationStatus, string> = {
  [RegistrationStatus.PENDING]: 'bg-amber-500/10 text-amber-400',
  [RegistrationStatus.CONFIRMED]: 'bg-emerald-500/10 text-emerald-400',
  [RegistrationStatus.CANCELLED]: 'bg-red-500/10 text-red-400',
  [RegistrationStatus.EXPIRED]: 'bg-zinc-500/10 text-zinc-400',
} as const

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.NOT_REQUIRED]: 'Non requis',
  [PaymentStatus.UNPAID]: 'Non pay\u00e9',
  [PaymentStatus.PENDING]: 'En attente',
  [PaymentStatus.PAID]: 'Pay\u00e9',
  [PaymentStatus.FAILED]: '\u00c9chou\u00e9',
  [PaymentStatus.REFUNDED]: 'Rembours\u00e9',
  [PaymentStatus.CANCELLED]: 'Annul\u00e9',
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

const PAGE_SIZE = 10

// ─── Edit Fields Dialog ──────────────────────────────────────────────────────

interface EditFieldsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registration: TournamentRegistrationItem
  fields: TournamentFieldItem[]
}

const EditFieldsDialog = ({
  open,
  onOpenChange,
  registration,
  fields,
}: EditFieldsDialogProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<Record<string, string | number>>(
    registration.fieldValues as Record<string, string | number>,
  )

  const handleSave = () => {
    startTransition(async () => {
      const result = await adminUpdateRegistrationFields({
        registrationId: registration.id,
        fieldValues: values,
      })
      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier les champs</DialogTitle>
          <DialogDescription>
            Modifier les valeurs des champs personnalis\u00e9s de{' '}
            {registration.user.displayName || registration.user.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {fields.map(field => (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={`field-${field.id}`}>
                {field.label}
                {field.required && <span className="ml-1 text-red-400">*</span>}
              </Label>
              <Input
                id={`field-${field.id}`}
                type={field.type === 'NUMBER' ? 'number' : 'text'}
                value={values[field.label] ?? ''}
                onChange={e => {
                  const val =
                    field.type === 'NUMBER'
                      ? e.target.value === ''
                        ? ''
                        : Number(e.target.value)
                      : e.target.value
                  setValues(prev => ({ ...prev, [field.label]: val }))
                }}
              />
            </div>
          ))}
          {fields.length === 0 && (
            <p className="text-sm text-zinc-500">
              Aucun champ personnalis\u00e9 configur\u00e9.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || fields.length === 0}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Change Team Dialog ──────────────────────────────────────────────────────

interface ChangeTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registration: TournamentRegistrationItem
  teams: TeamItem[]
}

const ChangeTeamDialog = ({
  open,
  onOpenChange,
  registration,
  teams,
}: ChangeTeamDialogProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [targetTeamId, setTargetTeamId] = useState('')

  // Filter out the current team
  const availableTeams = teams.filter(
    t => t.id !== registration.team?.id && !t.isFull,
  )

  const handleChange = () => {
    if (!targetTeamId) return
    startTransition(async () => {
      const result = await adminChangeTeam({
        registrationId: registration.id,
        targetTeamId,
      })
      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        setTargetTeamId('')
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer d\u2019\u00e9quipe</DialogTitle>
          <DialogDescription>
            D\u00e9placer{' '}
            {registration.user.displayName || registration.user.name} vers une
            autre \u00e9quipe.
            {registration.team && (
              <>
                {' '}
                \u00c9quipe actuelle :{' '}
                <span className="font-semibold text-white">
                  {registration.team.name}
                </span>
                .
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>\u00c9quipe cible</Label>
          {availableTeams.length > 0 ? (
            <Select value={targetTeamId} onValueChange={setTargetTeamId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="S\u00e9lectionner une \u00e9quipe" />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name} ({team.members.length} membres)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-zinc-500">
              Aucune \u00e9quipe disponible (non pleine).
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button onClick={handleChange} disabled={isPending || !targetTeamId}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            D\u00e9placer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
              Changer d\u2019\u00e9quipe
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
              Supprimer l\u2019inscription de{' '}
              {registration.user.displayName || registration.user.name} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera l\u2019inscription.
              {registration.team &&
                ' Le joueur sera retir\u00e9 de son \u00e9quipe.'}
              {registration.paymentStatus === PaymentStatus.PAID && (
                <>
                  {' '}
                  <span className="font-semibold text-amber-400">
                    Attention : le paiement ne sera pas automatiquement
                    rembours\u00e9.
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
              Un remboursement Stripe sera initi\u00e9 pour cette inscription.
              Le joueur sera d\u00e9sinscrit et retir\u00e9 de son \u00e9quipe
              le cas \u00e9ch\u00e9ant.
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
    </>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface TournamentRegistrationsProps {
  tournament: TournamentDetail
  registrations: TournamentRegistrationItem[]
  teams: TeamItem[]
}

export const TournamentRegistrations = ({
  tournament,
  registrations,
  teams,
}: TournamentRegistrationsProps) => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [page, setPage] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const isTeam = tournament.format === TournamentFormat.TEAM
  const isPaid = tournament.registrationType === 'PAID'
  const fields = tournament.fields

  // Filter registrations
  const filtered = useMemo(() => {
    let result = registrations
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        r =>
          r.user.name.toLowerCase().includes(q) ||
          r.user.displayName.toLowerCase().includes(q) ||
          (r.team?.name.toLowerCase().includes(q) ?? false),
      )
    }
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter)
    }
    if (paymentFilter !== 'all') {
      result = result.filter(r => r.paymentStatus === paymentFilter)
    }
    return result
  }, [registrations, search, statusFilter, paymentFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Reset page when filters change
  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPage(0)
  }, [])

  const handleStatusFilter = useCallback((value: string) => {
    setStatusFilter(value)
    setPage(0)
  }, [])

  const handlePaymentFilter = useCallback((value: string) => {
    setPaymentFilter(value)
    setPage(0)
  }, [])

  const toggleExpanded = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  // Count pending registrations for warning
  const pendingCount = registrations.filter(
    r => r.status === RegistrationStatus.PENDING,
  ).length

  return (
    <div className="space-y-4">
      {/* Warning banner for pending registrations */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
          <CreditCard className="size-4 shrink-0" />
          {pendingCount} inscription(s) en attente de paiement.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Rechercher un joueur..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9"
            aria-label="Rechercher un joueur"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value={RegistrationStatus.PENDING}>
                En attente
              </SelectItem>
              <SelectItem value={RegistrationStatus.CONFIRMED}>
                Confirm\u00e9
              </SelectItem>
            </SelectContent>
          </Select>
          {isPaid && (
            <Select value={paymentFilter} onValueChange={handlePaymentFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value={PaymentStatus.PAID}>Pay\u00e9</SelectItem>
                <SelectItem value={PaymentStatus.PENDING}>
                  En attente
                </SelectItem>
                <SelectItem value={PaymentStatus.REFUNDED}>
                  Rembours\u00e9
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-zinc-500">
        {filtered.length} inscription(s)
        {filtered.length !== registrations.length &&
          ` sur ${registrations.length}`}
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-8 text-center backdrop-blur-sm">
          <p className="text-sm text-zinc-500">
            Aucune inscription trouv\u00e9e.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-8 text-zinc-400" />
                  <TableHead className="text-zinc-400">Joueur</TableHead>
                  {isTeam && (
                    <TableHead className="hidden text-zinc-400 md:table-cell">
                      \u00c9quipe
                    </TableHead>
                  )}
                  <TableHead className="text-zinc-400">Statut</TableHead>
                  {isPaid && (
                    <TableHead className="hidden text-zinc-400 sm:table-cell">
                      Paiement
                    </TableHead>
                  )}
                  <TableHead className="hidden text-zinc-400 lg:table-cell">
                    Date
                  </TableHead>
                  <TableHead className="w-10 text-zinc-400" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map(reg => {
                  const isExpanded = expandedId === reg.id
                  const hasFieldValues =
                    fields.length > 0 &&
                    Object.keys(reg.fieldValues as Record<string, unknown>)
                      .length > 0
                  return (
                    <RegistrationRow
                      key={reg.id}
                      registration={reg}
                      tournament={tournament}
                      teams={teams}
                      fields={fields}
                      isTeam={isTeam}
                      isPaid={isPaid}
                      isExpanded={isExpanded}
                      hasFieldValues={hasFieldValues}
                      onToggleExpand={() => toggleExpanded(reg.id)}
                    />
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Page {page + 1} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
            >
              Pr\u00e9c\u00e9dent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Registration Row (extracted for expandable logic) ───────────────────────

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

const RegistrationRow = ({
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
  const fieldValues = registration.fieldValues as Record<
    string,
    string | number
  >

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
                isExpanded
                  ? 'Masquer les d\u00e9tails'
                  : 'Afficher les d\u00e9tails'
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
              <span className="text-sm text-zinc-600">\u2014</span>
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
                      : '\u2014'}
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
