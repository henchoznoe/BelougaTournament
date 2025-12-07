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

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const CONTENT = {
  TITLE: 'Stream Twitch',
  DESCRIPTION:
    "Regardez la compétition en direct sur Twitch, n'oubliez pas de vous abonner à la chaîne pour être informé des prochains tournois.",
} as const

export const metadata: Metadata = {
  title: 'Stream En Direct',
  description: 'Suivez les tournois Belouga en direct sur Twitch.',
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
          {CONTENT.TITLE}
        </h1>
        <p className="mt-2 text-zinc-400">{CONTENT.DESCRIPTION}</p>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1">
        <TwitchEmbed channel={channel} />
      </div>
    </div>
  )
}

export default StreamPage
