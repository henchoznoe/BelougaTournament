/**
 * File: app/(public)/stream/page.tsx
 * Description: Public stream page.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { TwitchEmbed } from '@/components/twitch-embed'
import { getSiteSettings } from '@/lib/data/settings'

export default async function StreamPage() {
    const settings = await getSiteSettings()

    // Extract channel name from URL or use as is
    let channel = 'quentadoulive'
    if (settings.socialTwitch) {
        const match = settings.socialTwitch.match(/twitch\.tv\/([a-zA-Z0-9_]+)/)
        if (match) {
            channel = match[1]
        } else if (!settings.socialTwitch.includes('/')) {
            channel = settings.socialTwitch
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 flex flex-col min-h-[80vh]">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-white">
                    Stream Twitch
                </h1>
                <p className="mt-2 text-zinc-400">
                    Regardez la compétition en direct sur Twitch, n'oubliez pas
                    de vous abonner à la chaîne pour être informé des prochains
                    tournois.
                </p>
            </div>

            <div className="flex-1 w-full max-w-6xl mx-auto">
                <TwitchEmbed channel={channel} />
            </div>
        </div>
    )
}
