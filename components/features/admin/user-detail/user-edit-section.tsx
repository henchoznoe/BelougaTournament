/**
 * File: components/features/admin/user-detail/user-edit-section.tsx
 * Description: Edit section with a display name form for admin user management.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Pencil, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateUser } from '@/lib/actions/users'
import type { UserDetail } from '@/lib/types/user'
import { cn } from '@/lib/utils/cn'
import { updateUserSchema } from '@/lib/validations/users'

type FormInput = { displayName: string }

interface UserEditSectionProps {
  user: UserDetail
}

export const UserEditSection = ({ user }: UserEditSectionProps) => {
  const router = useRouter()
  const [isSavePending, startSaveTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
  } = useForm<FormInput>({
    resolver: zodResolver(updateUserSchema.omit({ userId: true })),
    defaultValues: { displayName: user.displayName || '' },
    mode: 'onChange',
  })

  const handleSave = (data: FormInput) => {
    startSaveTransition(async () => {
      const result = await updateUser({
        userId: user.id,
        displayName: data.displayName,
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
    <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
      <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
        <div className="flex items-center gap-2">
          <Pencil className="size-4 text-zinc-500" />
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Modification
          </h2>
        </div>

        <div className="max-w-md space-y-1.5">
          <label
            htmlFor="userDisplayName"
            className="text-sm font-medium text-zinc-300"
          >
            Pseudo d&apos;affichage
          </label>
          <Input
            id="userDisplayName"
            {...register('displayName')}
            placeholder="Ex: PlayerXYZ"
            className="border-white/10 bg-white/5 text-zinc-200 placeholder:text-zinc-600"
          />
          {errors.displayName && (
            <p className="text-xs text-red-400">{errors.displayName.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-4">
          <Button
            type="submit"
            disabled={isSavePending || !isValid || !isDirty}
            className={cn(
              'ml-auto gap-2 bg-blue-600 text-white hover:bg-blue-500',
            )}
          >
            {isSavePending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  )
}
