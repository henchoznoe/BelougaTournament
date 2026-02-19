/**
 * File: app/admin/tournaments/new/page.tsx
 * Description: Page for creating a new tournament.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TournamentForm } from '@/components/features/tournament/form/tournament-form'
import { Button } from '@/components/ui/button'
import { createTournament } from '@/lib/actions/tournament'
import { APP_ROUTES } from '@/lib/config/routes'

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
            Create tournament
          </h1>
          <p className="text-zinc-400">Create a new tournament</p>
        </div>
      </div>

      <TournamentForm
        onSubmit={async values => {
          return await createTournament(values)
        }}
        submitLabel="Create tournament"
      />
    </div>
  )
}

export default CreateTournamentPage
