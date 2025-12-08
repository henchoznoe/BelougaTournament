/**
 * File: app/admin/settings/settings-form.tsx
 * Description: Admin settings forms for global site configuration.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

'use client'

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { Save, Upload } from 'lucide-react'
import Image from 'next/image'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateSettings } from '@/lib/actions/settings'
import { fr } from '@/lib/i18n/dictionaries/fr'
import type { SiteSettings } from '@/prisma/generated/prisma/client'

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

interface SettingsFormProps {
  settings: SiteSettings
}

interface SettingsState {
  message: string
  success?: boolean
  errors?: Record<string, string[]>
}

interface FieldConfig {
  key: keyof SiteSettings
  label: string
  placeholder: string
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const INITIAL_STATE: SettingsState = {
  message: '',
  errors: {},
}

const SOCIAL_CONFIG: FieldConfig[] = [
  {
    key: 'socialDiscord',
    label: 'Discord',
    placeholder: 'https://discord.gg/...',
  },
  {
    key: 'socialTwitch',
    label: 'Twitch',
    placeholder: 'https://twitch.tv/...',
  },
  {
    key: 'socialTiktok',
    label: 'TikTok',
    placeholder: 'https://tiktok.com/@...',
  },
  {
    key: 'socialInstagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/...',
  },
  {
    key: 'socialYoutube',
    label: 'YouTube',
    placeholder: 'https://youtube.com/...',
  },
]

const STATS_CONFIG: FieldConfig[] = [
  {
    key: 'statsYears',
    label: fr.pages.admin.settings.form.sections.stats.labels.years,
    placeholder: fr.pages.admin.settings.form.sections.stats.placeholders.years,
  },
  {
    key: 'statsPlayers',
    label: fr.pages.admin.settings.form.sections.stats.labels.players,
    placeholder:
      fr.pages.admin.settings.form.sections.stats.placeholders.players,
  },
  {
    key: 'statsTournaments',
    label: fr.pages.admin.settings.form.sections.stats.labels.tournaments,
    placeholder:
      fr.pages.admin.settings.form.sections.stats.placeholders.tournaments,
  },
  {
    key: 'statsMatches',
    label: fr.pages.admin.settings.form.sections.stats.labels.matches,
    placeholder:
      fr.pages.admin.settings.form.sections.stats.placeholders.matches,
  },
]

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const SettingsInput = ({
  field,
  defaultValue,
}: {
  field: FieldConfig
  defaultValue: string | null
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.key} className="text-zinc-400">
        {field.label}
      </Label>
      <Input
        id={field.key}
        name={field.key}
        defaultValue={defaultValue || ''}
        placeholder={field.placeholder}
        className="border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20"
      />
    </div>
  )
}

export const SettingsForm = ({ settings }: SettingsFormProps) => {
  const [state, formAction, isPending] = useActionState(
    updateSettings,
    INITIAL_STATE,
  )
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Handle local image preview before upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  // Toast feedback effect
  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message)
      } else {
        toast.error(state.message)
      }
    }
  }, [state])

  return (
    <form action={formAction}>
      <div className="grid gap-6">
        {/* General Section (Logo) */}
        <Card className="border-white/10 bg-zinc-900/50 shadow-xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">
              {fr.pages.admin.settings.form.sections.general.title}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {fr.pages.admin.settings.form.sections.general.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo" className="text-zinc-400">
                {fr.pages.admin.settings.form.sections.general.labels.logo}
              </Label>
              <div className="grid gap-4">
                {/* Logo Preview */}
                {(previewUrl || settings.logoUrl) && (
                  <div className="group relative size-32 overflow-hidden rounded-lg border border-white/10 bg-black/20">
                    <Image
                      src={previewUrl || settings.logoUrl || ''}
                      alt="Logo preview"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                )}

                {/* File Input */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {/* Hidden input to retain old URL if no new file is picked */}
                    <Input
                      type="hidden"
                      name="logoUrl"
                      value={settings.logoUrl || ''}
                    />
                    <Input
                      id="logo"
                      name="logo"
                      type="file"
                      accept=".png, .jpg, .jpeg"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('logo')?.click()}
                      className="border-white/10 bg-zinc-900/50 text-zinc-400 hover:bg-white/5 hover:text-white"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {
                        fr.pages.admin.settings.form.sections.general.buttons
                          .upload
                      }
                    </Button>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {fr.pages.admin.settings.form.sections.general.hints.format}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Media Section */}
        <Card className="border-white/10 bg-zinc-900/50 shadow-xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">
              {fr.pages.admin.settings.form.sections.social.title}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {fr.pages.admin.settings.form.sections.social.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {SOCIAL_CONFIG.map(field => (
                <SettingsInput
                  key={field.key}
                  field={field}
                  defaultValue={settings[field.key] as string}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Section */}
        <Card className="border-white/10 bg-zinc-900/50 shadow-xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">
              {fr.pages.admin.settings.form.sections.stats.title}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {fr.pages.admin.settings.form.sections.stats.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {STATS_CONFIG.map(field => (
                <SettingsInput
                  key={field.key}
                  field={field}
                  defaultValue={settings[field.key] as string}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit Action */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={isPending}
            className="bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500"
          >
            <Save className="mr-2 h-5 w-5" />
            {isPending
              ? fr.pages.admin.settings.form.buttons.saving
              : fr.pages.admin.settings.form.buttons.save}
          </Button>
        </div>
      </div>
    </form>
  )
}
