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
import { TwitchEmbed } from '@/components/twitch-embed'
import { BUSINESS_CONFIG } from '@/lib/config/business'
import { getSiteSettings } from '@/lib/data/settings'
import { fr } from '@/lib/i18n/dictionaries/fr'

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: fr.pages.stream.metaTitle,
  description: fr.pages.stream.metaDescription,
}

// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

const extractTwitchChannel = (
  urlOrUsername: string | null | undefined,
): string => {
  if (!urlOrUsername) {
    return BUSINESS_CONFIG.DEFAULT_TWITCH_CHANNEL
  }

  // Try to match standard Twitch URL patterns
  const match = urlOrUsername.match(/twitch\.tv\/([a-zA-Z0-9_]+)/)

  if (match?.[1]) {
    return match[1]
  }

  // If no URL pattern is found but string is not empty and has no slashes, assume it's the username
  if (!urlOrUsername.includes('/')) {
    return urlOrUsername
  }

  return BUSINESS_CONFIG.DEFAULT_TWITCH_CHANNEL
}

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const StreamPage = async () => {
  const settings = await getSiteSettings()
  const channel = extractTwitchChannel(settings.socialTwitch)

  return (
    <div className="container mx-auto flex min-h-[80vh] flex-col px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          {fr.pages.stream.title}
        </h1>
        <p className="mt-2 text-zinc-400">{fr.pages.stream.description}</p>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1">
        <TwitchEmbed channel={channel} />
      </div>
    </div>
  )
}

export default StreamPage
