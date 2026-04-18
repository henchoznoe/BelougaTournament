/**
 * File: components/admin/ui/user-actions-dropdown.tsx
 * Description: Dropdown menu with quick actions for each user row in the admin users table.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
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
import { deleteUser, demoteAdmin, promoteToAdmin } from '@/lib/actions/users'
import { ROUTES } from '@/lib/config/routes'
import type { ActionState } from '@/lib/types/actions'
import type { UserRow } from '@/lib/types/user'
import { Role } from '@/prisma/generated/prisma/enums'

interface UserActionsDropdownProps {
  user: UserRow
  viewerRole: Role
  viewerIsOwner: boolean
}

type ConfirmAction = 'promote' | 'demote' | 'delete'

export const UserActionsDropdown = ({
  user,
  viewerRole,
  viewerIsOwner,
}: UserActionsDropdownProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

  const canPromoteToAdmin = viewerIsOwner && user.role === Role.USER
  const canDemoteAdmin = viewerIsOwner && user.role === Role.ADMIN
  const canDelete = viewerIsOwner && user.role === Role.USER

  const hasRoleActions = canPromoteToAdmin || canDemoteAdmin
  const hasActions = hasRoleActions || canDelete

  if (!hasActions) return null

  const executeAction = (action: ConfirmAction) => {
    startTransition(async () => {
      let result: ActionState

      switch (action) {
        case 'promote':
          result = await promoteToAdmin({ userId: user.id })
          break
        case 'demote':
          result = await demoteAdmin({ userId: user.id })
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
      case 'demote':
        return 'Rétrograder à joueur'
      case 'delete':
        return "Supprimer l'utilisateur"
      default:
        return ''
    }
  }

  const getConfirmDescription = (): string => {
    switch (confirmAction) {
      case 'promote':
        return `${user.name} sera promu au rôle d'admin.`
      case 'demote':
        return `${user.name} sera rétrogradé à joueur.`
      case 'delete':
        return `${user.name} sera définitivement supprimé. Toutes les données associées (inscriptions, équipes, etc.) seront supprimées.`
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
              {canDemoteAdmin && (
                <DropdownMenuItem onClick={() => setConfirmAction('demote')}>
                  <ShieldOff className="size-4 text-orange-400" />
                  Rétrograder à joueur
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
    </>
  )
}
