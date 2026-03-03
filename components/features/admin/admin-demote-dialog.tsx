/**
 * File: components/features/admin/admin-demote-dialog.tsx
 * Description: Confirmation dialog for demoting an admin back to user role.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
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
import { demoteAdmin } from '@/lib/actions/admins'
import type { AdminUser } from '@/lib/types/admin'

interface AdminDemoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  admin: AdminUser
}

export const AdminDemoteDialog = ({
  open,
  onOpenChange,
  admin,
}: AdminDemoteDialogProps) => {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDemote = () => {
    startTransition(async () => {
      const result = await demoteAdmin({ userId: admin.id })

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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-white/10 bg-zinc-950">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Rétrograder l'administrateur
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Êtes-vous sûr de vouloir rétrograder{' '}
            <span className="font-medium text-zinc-200">{admin.name}</span> ? Il
            perdra son rôle d'admin et toutes ses assignations de tournois
            seront supprimées.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isPending}
            className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            variant="destructive"
            className="bg-red-500/10 text-red-500 hover:bg-red-500/20"
            onClick={handleDemote}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Rétrograder
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
