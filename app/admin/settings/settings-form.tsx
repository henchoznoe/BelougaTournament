'use client'

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
import type { SiteSettings } from '@/prisma/generated/prisma/client'

interface SettingsFormProps {
    settings: SiteSettings
}

const initialState = {
    message: '',
    errors: {},
}

export function SettingsForm({ settings }: SettingsFormProps) {
    const [state, formAction, isPending] = useActionState(
        updateSettings,
        initialState,
    )
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    useEffect(() => {
        if (state.message) {
            if (state.message === 'Settings updated successfully') {
                toast.success('Paramètres mis à jour avec succès')
            } else if (state.message !== 'Invalid fields') {
                toast.error('Une erreur est survenue')
            }
        }
    }, [state])

    return (
        <form action={formAction}>
            <div className="grid gap-6">
                <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-white">Général</CardTitle>
                        <CardDescription className="text-zinc-400">
                            Configuration de base du site web.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="logo" className="text-zinc-400">
                                Logo du site
                            </Label>
                            <div className="grid gap-4">
                                {(previewUrl || settings.logoUrl) && (
                                    <div className="relative size-32 rounded-lg border border-white/10 bg-black/20 overflow-hidden group">
                                        <Image
                                            src={
                                                previewUrl ||
                                                settings.logoUrl ||
                                                ''
                                            }
                                            alt="Logo preview"
                                            fill
                                            className="object-contain p-2"
                                        />
                                    </div>
                                )}
                                <div className="flex items-center gap-4">
                                    <div className="relative">
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
                                            onClick={() =>
                                                document
                                                    .getElementById('logo')
                                                    ?.click()
                                            }
                                            className="bg-zinc-900/50 border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white"
                                        >
                                            <Upload className="mr-2 h-4 w-4" />
                                            Choisir un fichier
                                        </Button>
                                    </div>
                                    <p className="text-xs text-zinc-500">
                                        Format accepté : PNG, JPG.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-white">
                            Réseaux Sociaux
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Liens vers vos profils sociaux affichés dans le pied
                            de page.
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
                                    defaultValue={settings.socialDiscord || ''}
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
                                    defaultValue={settings.socialTwitch || ''}
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
                                    defaultValue={settings.socialTiktok || ''}
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
                                    defaultValue={settings.socialYoutube || ''}
                                    placeholder="https://youtube.com/..."
                                    className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-white">
                            Statistiques
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Chiffres clés affichés sur la page d'accueil (ex:
                            "1.2k+", "500+").
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="statsYears"
                                    className="text-zinc-400"
                                >
                                    Années d'existence
                                </Label>
                                <Input
                                    id="statsYears"
                                    name="statsYears"
                                    defaultValue={settings.statsYears || ''}
                                    placeholder="ex: 2+"
                                    className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="statsPlayers"
                                    className="text-zinc-400"
                                >
                                    Joueurs Inscrits
                                </Label>
                                <Input
                                    id="statsPlayers"
                                    name="statsPlayers"
                                    defaultValue={settings.statsPlayers || ''}
                                    placeholder="ex: 500+"
                                    className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="statsTournaments"
                                    className="text-zinc-400"
                                >
                                    Tournois Organisés
                                </Label>
                                <Input
                                    id="statsTournaments"
                                    name="statsTournaments"
                                    defaultValue={
                                        settings.statsTournaments || ''
                                    }
                                    placeholder="ex: 50+"
                                    className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="statsMatches"
                                    className="text-zinc-400"
                                >
                                    Matchs Joués
                                </Label>
                                <Input
                                    id="statsMatches"
                                    name="statsMatches"
                                    defaultValue={settings.statsMatches || ''}
                                    placeholder="ex: 1.2k+"
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
                        disabled={isPending}
                        className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                    >
                        <Save className="mr-2 h-5 w-5" />
                        {isPending ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </div>
            </div>
        </form>
    )
}
