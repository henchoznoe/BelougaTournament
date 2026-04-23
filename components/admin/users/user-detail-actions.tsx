/**
 * File: components/admin/users/user-detail-actions.tsx
 * Description: User role badge toggle and edit/delete/ban action buttons for the detail page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Ban, Loader2, Pencil, ShieldCheck, Trash2, Unlock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  deleteUser,
  demoteAdmin,
  promoteToAdmin,
  updateUser,
} from '@/lib/actions/users'
import { VALIDATION_LIMITS } from '@/lib/config/constants'
import { ROUTES } from '@/lib/config/routes'
import type { UserDetail } from '@/lib/types/user'
import { cn } from '@/lib/utils/cn'
import { Role } from '@/prisma/generated/prisma/enums'
import { BanDialog, isActiveBan } from './ban-dialog'

// ─── Public helper: is ban currently active ───────────────────────────────────

export const isUserBanned = (
  user: Pick<UserDetail, 'bannedAt' | 'bannedUntil'>,
): boolean => isActiveBan(user)

// ─── Role Badge (clickable toggle) ──────────────────────────────────────────

interface UserRoleBadgeProps {
  user: UserDetail
  isSuperAdmin: boolean
}

export const UserRoleBadge = ({ user, isSuperAdmin }: UserRoleBadgeProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const isAdmin = user.role === Role.ADMIN
  const isUserSuperAdmin = user.role === Role.SUPER_ADMIN
  const canToggle = isSuperAdmin && !isUserSuperAdmin

  const handleToggle = () => {
    startTransition(async () => {
      const result = isAdmin
        ? await demoteAdmin({ userId: user.id })
        : await promoteToAdmin({ userId: user.id })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setConfirmOpen(false)
    })
  }

  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        canToggle && 'cursor-pointer',
        canToggle &&
          !isPending &&
          (isAdmin ? 'hover:bg-blue-500/20' : 'hover:bg-zinc-500/20'),
        isPending && 'cursor-wait opacity-60',
        isUserSuperAdmin
          ? 'bg-amber-500/10 text-amber-400'
          : isAdmin
            ? 'bg-blue-500/10 text-blue-400'
            : 'bg-zinc-500/10 text-zinc-400',
      )}
    >
      {isPending ? (
        <Loader2 className="size-3 animate-spin" />
      ) : isAdmin || isUserSuperAdmin ? (
        <ShieldCheck className="size-3" />
      ) : null}
      {isUserSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Joueur'}
    </span>
  )

  if (!canToggle) return badge

  return (
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={isPending}
          aria-label={`Changer le rôle de ${user.name}`}
        >
          {badge}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isAdmin ? 'Rétrograder à joueur' : 'Promouvoir admin'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isAdmin
              ? `${user.name} sera rétrogradé au rôle de joueur. Ses sessions seront invalidées.`
              : `${user.name} sera promu au rôle d'admin. Ses sessions seront invalidées.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleToggle} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Confirmer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Action Buttons (Edit displayName + Ban + Delete) ────────────────────────

interface UserDetailActionsProps {
  user: UserDetail
  isSuperAdmin: boolean
}

export const UserDetailActions = ({
  user,
  isSuperAdmin,
}: UserDetailActionsProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [banOpen, setBanOpen] = useState(false)
  const [displayName, setDisplayName] = useState(user.displayName || '')

  const canDelete = isSuperAdmin && user.role === Role.USER
  const canBan = user.role === Role.USER
  const isBanned = isUserBanned(user)

  const handleUpdate = () => {
    startTransition(async () => {
      const result = await updateUser({
        userId: user.id,
        displayName: displayName.trim(),
      })
      if (result.success) {
        toast.success(result.message)
        setEditOpen(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteUser({ userId: user.id })
      if (result.success) {
        toast.success(result.message)
        router.push(ROUTES.ADMIN_USERS)
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      {/* Edit displayName dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Pencil className="size-4" />
            Modifier
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le nom d&apos;affichage</DialogTitle>
            <DialogDescription>
              Modifiez le nom d&apos;affichage de {user.name}. Laissez vide pour
              utiliser le nom Discord.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="displayName">Nom d&apos;affichage</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={user.name}
              maxLength={VALIDATION_LIMITS.DISPLAY_NAME_MAX}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button onClick={handleUpdate} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban / Unban button */}
      {canBan && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBanOpen(true)}
            className={cn(
              isBanned
                ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                : 'border-red-500/30 text-red-400 hover:bg-red-500/10',
            )}
          >
            {isBanned ? (
              <>
                <Unlock className="size-4" />
                Banni
              </>
            ) : (
              <>
                <Ban className="size-4" />
                Bannir
              </>
            )}
          </Button>
          <BanDialog user={user} open={banOpen} onOpenChange={setBanOpen} />
        </>
      )}

      {/* Delete button */}
      {canDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="size-4" />
              Supprimer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer {user.name} ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. L&apos;utilisateur et toutes ses
                données associées (inscriptions, équipes, etc.) seront
                définitivement supprimés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isPending}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
