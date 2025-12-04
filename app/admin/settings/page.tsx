/**
 * File: app/admin/settings/page.tsx
 * Description: Admin settings page.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { Save, Upload } from 'lucide-react'
import { revalidatePath } from 'next/cache'
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
import { prisma } from '@/lib/prisma'

async function getSettings() {
    const settings = await prisma.siteSettings.findFirst()
    if (!settings) {
        return await prisma.siteSettings.create({
            data: {},
        })
    }
    return settings
}

async function updateSettings(formData: FormData) {
    'use server'
    const logoUrl = formData.get('logoUrl') as string
    const socialDiscord = formData.get('socialDiscord') as string
    const socialTiktok = formData.get('socialTiktok') as string
    const socialTwitch = formData.get('socialTwitch') as string
    const socialInstagram = formData.get('socialInstagram') as string
    const socialYoutube = formData.get('socialYoutube') as string

    const settings = await prisma.siteSettings.findFirst()

    if (settings) {
        await prisma.siteSettings.update({
            where: { id: settings.id },
            data: {
                logoUrl,
                socialDiscord,
                socialTiktok,
                socialTwitch,
                socialInstagram,
                socialYoutube,
            },
        })
    }

    revalidatePath('/')
    revalidatePath('/admin/settings')
}

export default async function SettingsPage() {
    const settings = await getSettings()

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
                    Settings
                </h1>
                <p className="text-zinc-400">
                    Configure global site settings and social links.
                </p>
            </div>

            <form action={updateSettings}>
                <div className="grid gap-6">
                    <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-white">
                                General
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
                                Basic configuration for the website.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="logoUrl"
                                    className="text-zinc-400"
                                >
                                    Logo URL
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="logoUrl"
                                        name="logoUrl"
                                        defaultValue={settings.logoUrl || ''}
                                        placeholder="https://..."
                                        className="bg-zinc-900/50 border-zinc-800 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="shrink-0 border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                    >
                                        <Upload className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-zinc-500">
                                    Direct link to your logo image (PNG/SVG
                                    recommended).
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-white">
                                Social Media
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
                                Links to your social profiles displayed in the
                                footer.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="socialDiscord"
                                        className="text-zinc-400"
                                    >
                                        Discord
                                    </Label>
                                    <Input
                                        id="socialDiscord"
                                        name="socialDiscord"
                                        defaultValue={
                                            settings.socialDiscord || ''
                                        }
                                        placeholder="https://discord.gg/..."
                                        className="bg-zinc-900/50 border-zinc-800 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="socialTwitch"
                                        className="text-zinc-400"
                                    >
                                        Twitch
                                    </Label>
                                    <Input
                                        id="socialTwitch"
                                        name="socialTwitch"
                                        defaultValue={
                                            settings.socialTwitch || ''
                                        }
                                        placeholder="https://twitch.tv/..."
                                        className="bg-zinc-900/50 border-zinc-800 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="socialTiktok"
                                        className="text-zinc-400"
                                    >
                                        TikTok
                                    </Label>
                                    <Input
                                        id="socialTiktok"
                                        name="socialTiktok"
                                        defaultValue={
                                            settings.socialTiktok || ''
                                        }
                                        placeholder="https://tiktok.com/@..."
                                        className="bg-zinc-900/50 border-zinc-800 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="socialInstagram"
                                        className="text-zinc-400"
                                    >
                                        Instagram
                                    </Label>
                                    <Input
                                        id="socialInstagram"
                                        name="socialInstagram"
                                        defaultValue={
                                            settings.socialInstagram || ''
                                        }
                                        placeholder="https://instagram.com/..."
                                        className="bg-zinc-900/50 border-zinc-800 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="socialYoutube"
                                        className="text-zinc-400"
                                    >
                                        YouTube
                                    </Label>
                                    <Input
                                        id="socialYoutube"
                                        name="socialYoutube"
                                        defaultValue={
                                            settings.socialYoutube || ''
                                        }
                                        placeholder="https://youtube.com/..."
                                        className="bg-zinc-900/50 border-zinc-800 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            size="lg"
                            className="shadow-lg shadow-blue-500/20"
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Save Changes
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
