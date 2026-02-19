/**
 * File: app/(public)/stream/page.tsx
 * Description: Public stream page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { TwitchEmbed } from '@/components/features/stream/twitch-embed'
import { getSiteSettings } from '@/lib/services/settings.service'

export const metadata: Metadata = {
  title: 'Stream',
  description: 'Stream for Belouga Tournament.',
}

const StreamPage = async () => {
  const settings = await getSiteSettings()

  return (
    <div className="container mx-auto flex min-h-[80vh] flex-col px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">Stream</h1>
        <p className="mt-2 text-zinc-400">Stream for Belouga Tournament.</p>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1">
        <TwitchEmbed channel={settings.socialTwitch} />
      </div>
    </div>
  )
}

export default StreamPage
