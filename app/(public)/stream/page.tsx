/**
 * File: app/(public)/stream/page.tsx
 * Description: Public stream page.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import type { Metadata } from 'next'
import { TwitchEmbed } from '@/components/features/stream/twitch-embed'
import { fr } from '@/lib/i18n/dictionaries/fr'
import { getSiteSettings } from '@/lib/services/settings.service'

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: fr.pages.stream.metaTitle,
  description: fr.pages.stream.metaDescription,
}

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const StreamPage = async () => {
  const settings = await getSiteSettings()

  return (
    <div className="container mx-auto flex min-h-[80vh] flex-col px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          {fr.pages.stream.title}
        </h1>
        <p className="mt-2 text-zinc-400">{fr.pages.stream.description}</p>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1">
        <TwitchEmbed channel={settings.socialTwitch} />
      </div>
    </div>
  )
}

export default StreamPage
