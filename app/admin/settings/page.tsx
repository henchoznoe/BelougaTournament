/**
 * File: app/admin/settings/page.tsx
 * Description: Admin settings page for global site configuration.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

import { Lock, Save, Upload } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
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
import { getSession, UserRole } from '@/lib/auth'
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
    const session = await getSession()

    if (
        !session ||
        !session.user ||
        session.user.role !== UserRole.SUPERADMIN
    ) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="size-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <Lock className="size-10 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold text-white">Accès Refusé</h1>
                <p className="text-zinc-400 max-w-md">
                    Cette page est strictement réservée aux Super
                    Administrateurs.
                </p>
                <Button
                    asChild
                    variant="outline"
                    className="border-white/10 hover:bg-white/5 text-white"
                >
                    <Link href="/admin">Retour au tableau de bord</Link>
                </Button>
            </div>
        )
    }

    const settings = await getSettings()

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
                    Paramètres
                </h1>
                <p className="text-zinc-400">
                    Configuration globale du site et liens sociaux.
                </p>
            </div>

            <form action={updateSettings}>
                <div className="grid gap-6">
                    <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-white">
                                Général
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
                                Configuration de base du site web.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="logoUrl"
                                    className="text-zinc-400"
                                >
                                    URL du Logo
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="logoUrl"
                                        name="logoUrl"
                                        defaultValue={settings.logoUrl || ''}
                                        placeholder="https://..."
                                        className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="shrink-0 border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                                    >
                                        <Upload className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-zinc-500">
                                    Lien direct vers votre image de logo
                                    (PNG/SVG recommandé).
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-white">
                                Réseaux Sociaux
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
                                Liens vers vos profils sociaux affichés dans le
                                pied de page.
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
                                        className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
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
                                        className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
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
                                        className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
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
                                        className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
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
                                        className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Enregistrer
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
