/**
 * File: app/(public)/stream/page.tsx
 * Description: Public stream page.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { getSiteSettings } from '@/lib/data/settings'

export default async function StreamPage() {
    const settings = await getSiteSettings()

    // Extract channel name from URL or use as is
    let channel = 'quentadoulive' // Default fallback
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
                    Live Stream
                </h1>
                <p className="mt-2 text-zinc-400">
                    Watch the action live on Twitch
                </p>
            </div>

            <div className="flex-1 w-full max-w-6xl mx-auto">
                <div className="aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl relative">
                    <iframe
                        src={`https://player.twitch.tv/?channel=${channel}&parent=localhost&parent=belouga-tournament.vercel.app`}
                        height="100%"
                        width="100%"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full"
                        title="Twitch Stream"
                    ></iframe>
                </div>
            </div>
        </div>
    )
}
