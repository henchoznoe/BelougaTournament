/**
 * File: app/admin/settings/settings-form.tsx
 * Description: Client component for updating site settings.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateSettings } from '@/lib/actions/settings'

import { cn } from '@/lib/utils'

interface SettingsFormProps {
    initialSettings: {
        logoUrl: string | null
        socialDiscord: string | null
        socialTwitch: string | null
        socialTiktok: string | null
        socialInstagram: string | null
        socialYoutube: string | null
    }
}

const initialState = {
    message: '',
    errors: {},
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
    const [state, action, isPending] = useActionState(
        updateSettings,
        initialState,
    )

    return (
        <form action={action} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="logo">Logo</Label>
                <div className="flex items-center gap-4">
                    {initialSettings.logoUrl && (
                        // biome-ignore lint/performance/noImgElement: dynamic logo size
                        <img
                            src={initialSettings.logoUrl}
                            alt="Current Logo"
                            className="h-10 w-auto rounded border border-zinc-200 bg-white p-1"
                        />
                    )}
                    <Input id="logo" name="logo" type="file" accept="image/*" />
                    <input
                        type="hidden"
                        name="logoUrl"
                        value={initialSettings.logoUrl || ''}
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    Upload a new logo to replace the current one.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                    <Label htmlFor="socialDiscord">Discord URL</Label>
                    <Input
                        id="socialDiscord"
                        name="socialDiscord"
                        defaultValue={initialSettings.socialDiscord || ''}
                        placeholder="https://discord.gg/..."
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="socialTwitch">Twitch URL</Label>
                    <Input
                        id="socialTwitch"
                        name="socialTwitch"
                        defaultValue={initialSettings.socialTwitch || ''}
                        placeholder="https://twitch.tv/..."
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="socialYoutube">YouTube URL</Label>
                    <Input
                        id="socialYoutube"
                        name="socialYoutube"
                        defaultValue={initialSettings.socialYoutube || ''}
                        placeholder="https://youtube.com/..."
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="socialTiktok">TikTok URL</Label>
                    <Input
                        id="socialTiktok"
                        name="socialTiktok"
                        defaultValue={initialSettings.socialTiktok || ''}
                        placeholder="https://tiktok.com/..."
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="socialInstagram">Instagram URL</Label>
                    <Input
                        id="socialInstagram"
                        name="socialInstagram"
                        defaultValue={initialSettings.socialInstagram || ''}
                        placeholder="https://instagram.com/..."
                    />
                </div>
            </div>

            {state?.message && (
                <p
                    className={cn(
                        'text-sm',
                        state.message.includes('success')
                            ? 'text-green-500'
                            : 'text-red-500',
                    )}
                >
                    {state.message}
                </p>
            )}

            <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Settings'}
            </Button>
        </form>
    )
}
