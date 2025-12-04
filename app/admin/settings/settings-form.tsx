/**
 * File: app/admin/settings/settings-form.tsx
 * Description: Client component for updating site settings.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

'use client'

import {
    Gamepad2,
    Instagram,
    Loader2,
    Save,
    Twitch,
    Upload,
    Youtube,
} from 'lucide-react'
import { useActionState } from 'react'
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
        <form action={action} className="space-y-8">
            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-white">
                        Branding
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        Manage your site's visual identity.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <Label htmlFor="logo" className="text-zinc-200">
                            Logo
                        </Label>
                        <div className="flex items-start gap-6">
                            <div className="shrink-0">
                                {initialSettings.logoUrl ? (
                                    // biome-ignore lint/performance/noImgElement: dynamic logo size
                                    <img
                                        src={initialSettings.logoUrl}
                                        alt="Current Logo"
                                        className="h-24 w-24 rounded-lg border border-zinc-700 bg-zinc-950 object-contain p-2"
                                    />
                                ) : (
                                    <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50">
                                        <Upload className="size-8 text-zinc-500" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <Input
                                    id="logo"
                                    name="logo"
                                    type="file"
                                    accept="image/*"
                                    className="bg-zinc-950 border-zinc-800 text-zinc-300 file:text-zinc-300 file:bg-zinc-900 file:border-0 file:mr-4 file:py-1 file:px-2 file:rounded-md hover:file:bg-zinc-800 transition-all"
                                />
                                <p className="text-xs text-zinc-500">
                                    Recommended size: 512x512px. Max file size:
                                    2MB.
                                </p>
                                <input
                                    type="hidden"
                                    name="logoUrl"
                                    value={initialSettings.logoUrl || ''}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-white">
                        Social Links
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        Connect your community platforms.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label
                            htmlFor="socialDiscord"
                            className="text-zinc-200 flex items-center gap-2"
                        >
                            <Gamepad2 className="size-4 text-[#5865F2]" />
                            Discord
                        </Label>
                        <Input
                            id="socialDiscord"
                            name="socialDiscord"
                            defaultValue={initialSettings.socialDiscord || ''}
                            placeholder="https://discord.gg/..."
                            className="bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-blue-500/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="socialTwitch"
                            className="text-zinc-200 flex items-center gap-2"
                        >
                            <Twitch className="size-4 text-[#9146FF]" />
                            Twitch
                        </Label>
                        <Input
                            id="socialTwitch"
                            name="socialTwitch"
                            defaultValue={initialSettings.socialTwitch || ''}
                            placeholder="https://twitch.tv/..."
                            className="bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-purple-500/50 focus:ring-purple-500/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="socialYoutube"
                            className="text-zinc-200 flex items-center gap-2"
                        >
                            <Youtube className="size-4 text-[#FF0000]" />
                            YouTube
                        </Label>
                        <Input
                            id="socialYoutube"
                            name="socialYoutube"
                            defaultValue={initialSettings.socialYoutube || ''}
                            placeholder="https://youtube.com/..."
                            className="bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-red-500/50 focus:ring-red-500/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="socialTiktok"
                            className="text-zinc-200 flex items-center gap-2"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="size-4 text-pink-500"
                            >
                                <title>TikTok</title>
                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                            </svg>
                            TikTok
                        </Label>
                        <Input
                            id="socialTiktok"
                            name="socialTiktok"
                            defaultValue={initialSettings.socialTiktok || ''}
                            placeholder="https://tiktok.com/..."
                            className="bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-pink-500/50 focus:ring-pink-500/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="socialInstagram"
                            className="text-zinc-200 flex items-center gap-2"
                        >
                            <Instagram className="size-4 text-[#E1306C]" />
                            Instagram
                        </Label>
                        <Input
                            id="socialInstagram"
                            name="socialInstagram"
                            defaultValue={initialSettings.socialInstagram || ''}
                            placeholder="https://instagram.com/..."
                            className="bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-pink-600/50 focus:ring-pink-600/20"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between">
                {state?.message && (
                    <p
                        className={cn(
                            'text-sm font-medium',
                            state.message.includes('success')
                                ? 'text-green-400'
                                : 'text-red-400',
                        )}
                    >
                        {state.message}
                    </p>
                )}
                <Button
                    type="submit"
                    disabled={isPending}
                    className="ml-auto bg-blue-600 hover:bg-blue-700 text-white min-w-[150px] shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 size-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
