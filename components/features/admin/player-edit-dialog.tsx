/**
 * File: components/features/admin/player-edit-dialog.tsx
 * Description: Dialog for editing a player's display name (admin+).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { updatePlayer } from '@/lib/actions/players'
import type { PlayerRow } from '@/lib/types/player'
import { updatePlayerSchema } from '@/lib/validations/players'

interface PlayerEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  player: PlayerRow
}

type FormInput = { displayName: string }

export const PlayerEditDialog = ({
  open,
  onOpenChange,
  player,
}: PlayerEditDialogProps) => {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<FormInput>({
    resolver: zodResolver(updatePlayerSchema.omit({ userId: true })),
    defaultValues: { displayName: player.displayName || '' },
    mode: 'onChange',
  })

  // Re-populate the form each time the dialog opens for a (possibly different) player
  useEffect(() => {
    if (open) {
      reset({ displayName: player.displayName || '' })
    }
  }, [open, player, reset])

  const onSubmit = (data: FormInput) => {
    startTransition(async () => {
      const result = await updatePlayer({
        userId: player.id,
        displayName: data.displayName,
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
      <DialogContent className="border-white/10 bg-zinc-950 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Modifier le joueur</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Modifiez le pseudo d'affichage de{' '}
            <span className="font-medium text-zinc-200">{player.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="displayName"
              className="text-sm font-medium text-zinc-300"
            >
              Pseudo d'affichage
            </label>
            <Input
              id="displayName"
              {...register('displayName')}
              placeholder="Ex: PlayerXYZ"
              className="border-white/10 bg-white/5 text-zinc-200 placeholder:text-zinc-600"
            />
            {errors.displayName && (
              <p className="text-xs text-red-400">
                {errors.displayName.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending || !isDirty || !isValid}
              className="gap-2 bg-blue-600 text-white hover:bg-blue-500"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
