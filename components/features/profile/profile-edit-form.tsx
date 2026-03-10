/**
 * File: components/features/profile/profile-edit-form.tsx
 * Description: Client-side form for editing the user display name.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Pencil, Save, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile } from '@/lib/actions/profile'
import { type ProfileInput, profileSchema } from '@/lib/validations/profile'

interface ProfileEditFormProps {
  currentDisplayName: string
}

export const ProfileEditForm = ({
  currentDisplayName,
}: ProfileEditFormProps) => {
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: currentDisplayName },
  })

  const onCancel = () => {
    reset({ displayName: currentDisplayName })
    setIsEditing(false)
  }

  const onSubmit = (data: ProfileInput) => {
    startTransition(async () => {
      const result = await updateProfile(data)

      if (result.success) {
        toast.success(result.message)
        setIsEditing(false)
        reset({ displayName: data.displayName })
        router.refresh()
      } else if (result.errors?.displayName) {
        toast.error(result.errors.displayName[0])
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/2 px-4 py-3">
        <Pencil className="size-4 shrink-0 text-zinc-500" />
        <span className="text-sm text-zinc-300">{currentDisplayName}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto"
          onClick={() => setIsEditing(true)}
          aria-label="Modifier le nom d'affichage"
        >
          <Pencil className="size-3.5 text-zinc-400" />
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-2 rounded-2xl border border-blue-500/10 bg-blue-500/5 p-4"
    >
      <Label htmlFor="displayName" className="text-xs text-zinc-400">
        Nom
      </Label>
      <div className="flex gap-2">
        <Input
          id="displayName"
          autoComplete="given-name"
          disabled={isPending}
          className="h-9 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20"
          {...register('displayName')}
        />
        <Button
          type="submit"
          size="icon-sm"
          disabled={isPending || !isDirty}
          className="shrink-0"
          aria-label="Enregistrer"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={isPending}
          className="shrink-0"
          onClick={onCancel}
          aria-label="Annuler"
        >
          <X className="size-3.5" />
        </Button>
      </div>
      {errors.displayName && (
        <p className="text-xs text-red-400">{errors.displayName.message}</p>
      )}
    </form>
  )
}
