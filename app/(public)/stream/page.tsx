/**
 * File: app/(public)/stream/page.tsx
 * Description: Stream page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { TwitchPlayer } from '@/components/public/stream/twitch-player'
import { PageHeader } from '@/components/ui/page-header'
import { getGlobalSettings } from '@/lib/services/settings'

export const metadata: Metadata = {
  title: 'Stream',
  description:
    'Retrouvez en direct toutes nos compétitions et événements spéciaux sur notre chaîne officielle.',
}

const StreamPage = async () => {
  const globalSettings = await getGlobalSettings()

  return (
    <div className="container mx-auto px-4 py-32 flex flex-col items-center">
      <PageHeader
        title="Live Stream"
        description="Retrouvez en direct toutes nos compétitions et événements spéciaux sur notre chaîne officielle."
        className="mb-12"
      />
      <div className="w-full max-w-5xl min-w-0 overflow-hidden">
        <TwitchPlayer channel={globalSettings.twitchUsername ?? undefined} />
      </div>
    </div>
  )
}

export default StreamPage
