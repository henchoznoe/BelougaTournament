/**
 * File: app/(public)/page.tsx
 * Description: Landing page with hero section and featured tournaments.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { SessionInfo } from '@/components/features/auth/session-info'
import { getCommitHash } from '@/lib/utils/commit-hash'

export const metadata: Metadata = {
  title: 'Accueil',
  description: 'Accueil',
}

/** Landing page displaying session info and build hash for verification. */
const LandingPage = async () => {
  return (
    <div className="flex flex-col gap-24 pb-24 overflow-x-hidden">
      <div className="flex flex-col items-center gap-6 pt-12">
        <h1 className="font-paladins text-3xl tracking-wider">
          Belouga Tournament
        </h1>
        <p className="text-xs text-zinc-500">build {getCommitHash()}</p>
        <SessionInfo />
      </div>
    </div>
  )
}

export default LandingPage
