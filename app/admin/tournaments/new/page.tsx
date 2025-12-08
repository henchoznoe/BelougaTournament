/**
 * File: app/admin/tournaments/new/page.tsx
 * Description: Page for creating a new tournament.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

'use client'

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TournamentForm } from '@/components/features/tournament/form/tournament-form'
import { Button } from '@/components/ui/button'
import { createTournament } from '@/lib/actions/tournaments'
import { APP_ROUTES } from '@/lib/config/routes'
import { fr } from '@/lib/i18n/dictionaries/fr'

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const CreateTournamentPage = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button
          asChild
          variant="outline"
          size="icon"
          className="shrink-0 border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
        >
          <Link href={APP_ROUTES.ADMIN_TOURNAMENTS}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
            {fr.pages.admin.tournaments.form.createTitle}
          </h1>
          <p className="text-zinc-400">
            {fr.pages.admin.tournaments.form.createSubtitle}
          </p>
        </div>
      </div>

      <TournamentForm
        onSubmit={async values => {
          return await createTournament(values)
        }}
        submitLabel={fr.pages.admin.tournaments.form.createSubmit}
      />
    </div>
  )
}

export default CreateTournamentPage
