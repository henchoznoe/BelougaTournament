/**
 * File: components/features/admin/settings-form.tsx
 * Description: Form for editing global platform settings (SUPERADMIN only).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { LogoPicker } from '@/components/features/admin/logo-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateSettings } from '@/lib/actions/settings'
import { type SettingsInput, settingsSchema } from '@/lib/validations/settings'
import type { GlobalSettings } from '@/prisma/generated/prisma/client'

interface SettingsFormProps {
  settings: GlobalSettings
}

/** Converts null to empty string for form default values. */
const fromNullable = (val: string | null): string => val ?? ''

export const SettingsForm = ({ settings }: SettingsFormProps) => {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      logoUrl: fromNullable(settings.logoUrl),
      twitchUsername: fromNullable(settings.twitchUsername),
      twitchUrl: fromNullable(settings.twitchUrl),
      discordUrl: fromNullable(settings.discordUrl),
      instagramUrl: fromNullable(settings.instagramUrl),
      tiktokUrl: fromNullable(settings.tiktokUrl),
      youtubeUrl: fromNullable(settings.youtubeUrl),
    },
  })

  const onSubmit = (data: SettingsInput) => {
    startTransition(async () => {
      const result = await updateSettings(data)

      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm"
    >
      {/* General section */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
          Général
        </h3>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-zinc-400">Logo</Label>
          <LogoPicker
            value={watch('logoUrl')}
            onChange={url => setValue('logoUrl', url, { shouldDirty: true })}
          />
          {errors.logoUrl?.message && (
            <p className="text-xs text-red-400">{errors.logoUrl.message}</p>
          )}
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {/* Twitch section */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
          Twitch
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsField
            id="twitchUsername"
            label="Nom d'utilisateur (pour le stream)"
            placeholder="quentadoulive"
            error={errors.twitchUsername?.message}
            disabled={isPending}
            {...register('twitchUsername')}
          />
          <SettingsField
            id="twitchUrl"
            label="URL de la chaîne"
            placeholder="https://twitch.tv/quentadoulive"
            error={errors.twitchUrl?.message}
            disabled={isPending}
            {...register('twitchUrl')}
          />
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {/* Social links section */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
          Réseaux sociaux
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsField
            id="discordUrl"
            label="Discord"
            placeholder="https://discord.gg/..."
            error={errors.discordUrl?.message}
            disabled={isPending}
            {...register('discordUrl')}
          />
          <SettingsField
            id="instagramUrl"
            label="Instagram"
            placeholder="https://instagram.com/..."
            error={errors.instagramUrl?.message}
            disabled={isPending}
            {...register('instagramUrl')}
          />
          <SettingsField
            id="tiktokUrl"
            label="TikTok"
            placeholder="https://tiktok.com/@..."
            error={errors.tiktokUrl?.message}
            disabled={isPending}
            {...register('tiktokUrl')}
          />
          <SettingsField
            id="youtubeUrl"
            label="YouTube"
            placeholder="https://youtube.com/@..."
            error={errors.youtubeUrl?.message}
            disabled={isPending}
            {...register('youtubeUrl')}
          />
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending || !isDirty}
          className="gap-2 bg-blue-600 text-white hover:bg-blue-500"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Enregistrer
        </Button>
      </div>
    </form>
  )
}

/** Internal reusable field component for settings inputs. */
interface SettingsFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

const SettingsField = ({
  id,
  label,
  error,
  ...inputProps
}: SettingsFieldProps) => {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-zinc-400">
        {label}
      </Label>
      <Input
        id={id}
        className="h-10 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20"
        {...inputProps}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
