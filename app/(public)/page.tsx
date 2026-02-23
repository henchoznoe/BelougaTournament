/**
 * File: app/(public)/page.tsx
 * Description: Landing page with hero section and featured tournaments.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { getCommitHash } from '@/lib/utils/commit-hash'

export const metadata: Metadata = {
  title: 'Accueil',
  description: 'Accueil',
}

const LandingPage = async () => {
  return (
    <div className="flex flex-col gap-24 pb-24 overflow-x-hidden">
      Belouga Tournament (build {getCommitHash()})
    </div>
  )
}

export default LandingPage
