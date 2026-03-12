/**
 * File: components/features/admin/user-actions-dropdown.tsx
 * Description: Dropdown menu with quick actions for each user row in the admin users table.
 * Author: Noe Henchoz
 * License: MIT
 * Copyright (c) 2026 Noe Henchoz
 */

'use client'

import {
  Ban,
  Eye,
  Loader2,
  MoreHorizontal,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { BanUserDialog } from '@/components/features/admin/ban-user-dialog'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  deleteUser,
  demoteAdmin,
  promoteToAdmin,
  promoteToSuperAdmin,
  unbanUser,
} from '@/lib/actions/users'
import { ROUTES } from '@/lib/config/routes'
import type { ActionState } from '@/lib/types/actions'
import type { UserRow } from '@/lib/types/user'
import { isBanned } from '@/lib/utils/auth.helpers'
import { Role } from '@/prisma/generated/prisma/enums'

interface UserActionsDropdownProps {
  user: UserRow
  viewerRole: Role
  viewerIsOwner: boolean
}

type ConfirmAction =
  | 'promote'
  | 'promoteSuperAdmin'
  | 'demote'
  | 'demoteSuperAdmin'
  | 'unban'
  | 'delete'

export const UserActionsDropdown = ({
  user,
  viewerRole,
  viewerIsOwner,
}: UserActionsDropdownProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [showBanDialog, setShowBanDialog] = useState(false)

  const viewerIsSuperAdmin = viewerRole === Role.SUPERADMIN
  const banned = isBanned(user.bannedUntil)

  // Permission checks
  const canPromoteToAdmin =
    viewerIsSuperAdmin && user.role === Role.USER && !banned
  const canPromoteToSuperAdmin =
    viewerIsSuperAdmin && viewerIsOwner && user.role === Role.ADMIN
  const canDemoteAdmin = viewerIsSuperAdmin && user.role === Role.ADMIN
  const canDemoteSuperAdmin =
    viewerIsSuperAdmin && viewerIsOwner && user.role === Role.SUPERADMIN
  const canBan = user.role === Role.USER && !banned
  const canUnban = user.role === Role.USER && banned
  const canDelete = viewerIsSuperAdmin && user.role === Role.USER

  const hasRoleActions =
    canPromoteToAdmin ||
    canPromoteToSuperAdmin ||
    canDemoteAdmin ||
    canDemoteSuperAdmin
  const hasBanActions = canBan || canUnban
  const hasActions = hasRoleActions || hasBanActions || canDelete

  if (!hasActions) return null

  const executeAction = (action: ConfirmAction) => {
    startTransition(async () => {
      let result: ActionState
      switch (action) {
        case 'promote':
          result = await promoteToAdmin({ userId: user.id })
          break
        case 'promoteSuperAdmin':
          result = await promoteToSuperAdmin({ userId: user.id })
          break
        case 'demote':
        case 'demoteSuperAdmin':
          result = await demoteAdmin({ userId: user.id })
          break
        case 'unban':
          result = await unbanUser({ userId: user.id })
          break
        case 'delete':
          result = await deleteUser({ userId: user.id })
          break
      }
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
      setConfirmAction(null)
    })
  }

  const getConfirmTitle = (): string => {
    switch (confirmAction) {
      case 'promote':
        return 'Promouvoir admin'
      case 'promoteSuperAdmin':
        return 'Promouvoir super admin'
      case 'demote':
        return 'Retrograder a joueur'
      case 'demoteSuperAdmin':
        return 'Retrograder a admin'
      case 'unban':
        return 'Debannir'
      case 'delete':
        return "Supprimer l'utilisateur"
      default:
        return ''
    }
  }

  const getConfirmDescription = (): string => {
    switch (confirmAction) {
      case 'promote':
        return `${user.name} sera promu au role d'admin.`
      case 'promoteSuperAdmin':
        return `${user.name} sera promu au role de super admin. Ses assignations de tournois seront supprimees.`
      case 'demote':
        return `${user.name} sera retrograde a joueur. Ses assignations de tournois seront supprimees.`
      case 'demoteSuperAdmin':
        return `${user.name} sera retrograde au role d'admin.`
      case 'unban':
        return `${user.name} sera debanni et pourra a nouveau acceder a la plateforme.`
      case 'delete':
        return `${user.name} sera definitivement supprime. Toutes les donnees associees (inscriptions, equipes, etc.) seront supprimees.`
      default:
        return ''
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions pour ${user.name}`}
            className="text-zinc-400 hover:text-zinc-200"
            onClick={e => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border-white/10 bg-zinc-950"
          onClick={e => e.stopPropagation()}
        >
          <DropdownMenuItem asChild>
            <Link href={ROUTES.ADMIN_USER_DETAIL(user.id)}>
              <Eye className="size-4" />
              Voir le profil
            </Link>
          </DropdownMenuItem>

          {hasRoleActions && (
            <>
              <DropdownMenuSeparator className="bg-white/5" />
              {canPromoteToAdmin && (
                <DropdownMenuItem onClick={() => setConfirmAction('promote')}>
                  <ShieldCheck className="size-4 text-blue-400" />
                  Promouvoir admin
                </DropdownMenuItem>
              )}
              {canPromoteToSuperAdmin && (
                <DropdownMenuItem
                  onClick={() => setConfirmAction('promoteSuperAdmin')}
                >
                  <ShieldCheck className="size-4 text-amber-400" />
                  Promouvoir super admin
                </DropdownMenuItem>
              )}
              {canDemoteAdmin && (
                <DropdownMenuItem onClick={() => setConfirmAction('demote')}>
                  <ShieldOff className="size-4 text-orange-400" />
                  Retrograder a joueur
                </DropdownMenuItem>
              )}
              {canDemoteSuperAdmin && (
                <DropdownMenuItem
                  onClick={() => setConfirmAction('demoteSuperAdmin')}
                >
                  <ShieldOff className="size-4 text-orange-400" />
                  Retrograder a admin
                </DropdownMenuItem>
              )}
            </>
          )}

          {hasBanActions && (
            <>
              <DropdownMenuSeparator className="bg-white/5" />
              {canBan && (
                <DropdownMenuItem onClick={() => setShowBanDialog(true)}>
                  <Ban className="size-4 text-red-400" />
                  Bannir
                </DropdownMenuItem>
              )}
              {canUnban && (
                <DropdownMenuItem onClick={() => setConfirmAction('unban')}>
                  <ShieldOff className="size-4 text-emerald-400" />
                  Debannir
                </DropdownMenuItem>
              )}
            </>
          )}

          {canDelete && (
            <>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirmAction('delete')}
              >
                <Trash2 className="size-4" />
                Supprimer
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation AlertDialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={open => !open && setConfirmAction(null)}
      >
        <AlertDialogContent className="border-white/10 bg-zinc-950">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {getConfirmTitle()}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {getConfirmDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isPending}
              className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => confirmAction && executeAction(confirmAction)}
              variant={confirmAction === 'delete' ? 'destructive' : 'default'}
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban Dialog */}
      <BanUserDialog
        userId={user.id}
        userName={user.name}
        open={showBanDialog}
        onOpenChange={setShowBanDialog}
      />
    </>
  )
}
