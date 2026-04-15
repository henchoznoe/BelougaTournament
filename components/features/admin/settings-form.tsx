/**
 * File: components/features/admin/settings-form.tsx
 * Description: Form for editing global platform settings.
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
import { Textarea } from '@/components/ui/textarea'
import { updateSettings } from '@/lib/actions/settings'
import { fromNullable } from '@/lib/utils/formatting'
import { type SettingsInput, settingsSchema } from '@/lib/validations/settings'
import type { GlobalSettings } from '@/prisma/generated/prisma/client'

interface SettingsFormProps {
  settings: GlobalSettings
}

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
      feature1Title: fromNullable(settings.feature1Title),
      feature1Description: fromNullable(settings.feature1Description),
      feature2Title: fromNullable(settings.feature2Title),
      feature2Description: fromNullable(settings.feature2Description),
      feature3Title: fromNullable(settings.feature3Title),
      feature3Description: fromNullable(settings.feature3Description),
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

      {/* Features section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
            Fonctionnalités
          </h3>
          <p className="mt-1 text-xs text-zinc-600">
            Titre et description des 3 cartes affichées sur la page d'accueil.
            Laissez vide pour utiliser les valeurs par défaut.
          </p>
        </div>

        {/* Feature 1 — orange */}
        <div className="space-y-3 rounded-xl border border-orange-500/10 bg-orange-500/5 p-4">
          <p className="text-xs font-medium text-orange-400/80">
            Fonctionnalité 1
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <SettingsField
              id="feature1Title"
              label="Titre"
              placeholder="Matchmaking Équitable"
              error={errors.feature1Title?.message}
              disabled={isPending}
              {...register('feature1Title')}
            />
            <SettingsTextareaField
              id="feature1Description"
              label="Description"
              placeholder="Affrontez des joueurs de votre niveau grâce à notre système de rangs strict. Pas de smurfs, juste du pur talent."
              error={errors.feature1Description?.message}
              disabled={isPending}
              {...register('feature1Description')}
            />
          </div>
        </div>

        {/* Feature 2 — blue */}
        <div className="space-y-3 rounded-xl border border-blue-500/10 bg-blue-500/5 p-4">
          <p className="text-xs font-medium text-blue-400/80">
            Fonctionnalité 2
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <SettingsField
              id="feature2Title"
              label="Titre"
              placeholder="Format Compétitif"
              error={errors.feature2Title?.message}
              disabled={isPending}
              {...register('feature2Title')}
            />
            <SettingsTextareaField
              id="feature2Description"
              label="Description"
              placeholder="Arbre de tournoi professionnel, phases de poules et playoffs. Vivez la pression des grandes ligues e-sport."
              error={errors.feature2Description?.message}
              disabled={isPending}
              {...register('feature2Description')}
            />
          </div>
        </div>

        {/* Feature 3 — purple */}
        <div className="space-y-3 rounded-xl border border-purple-500/10 bg-purple-500/5 p-4">
          <p className="text-xs font-medium text-purple-400/80">
            Fonctionnalité 3
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <SettingsField
              id="feature3Title"
              label="Titre"
              placeholder="Diffusion en Direct"
              error={errors.feature3Title?.message}
              disabled={isPending}
              {...register('feature3Title')}
            />
            <SettingsTextareaField
              id="feature3Description"
              label="Description"
              placeholder="Les phases finales sont commentées et diffusées sur notre chaîne Twitch. Montrez votre talent à toute la communauté."
              error={errors.feature3Description?.message}
              disabled={isPending}
              {...register('feature3Description')}
            />
          </div>
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

/** Internal reusable textarea field component for settings multi-line inputs. */
interface SettingsTextareaFieldProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

const SettingsTextareaField = ({
  id,
  label,
  error,
  ...textareaProps
}: SettingsTextareaFieldProps) => {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-zinc-400">
        {label}
      </Label>
      <Textarea
        id={id}
        className="min-h-20 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20"
        {...textareaProps}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
