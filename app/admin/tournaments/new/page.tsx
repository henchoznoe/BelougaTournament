/**
 * File: app/admin/tournaments/new/page.tsx
 * Description: Page for creating a new tournament.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TournamentForm } from '@/components/admin/tournament-form'
import { createTournament } from '@/lib/actions/tournaments'

export default function CreateTournamentPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <Button
                    asChild
                    variant="outline"
                    size="icon"
                    className="shrink-0 border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                >
                    <Link href="/admin/tournaments">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
                        Créer un Tournoi
                    </h1>
                    <p className="text-zinc-400">
                        Configurez les détails et les règles de votre nouveau
                        tournoi.
                    </p>
                </div>
            </div>

            <TournamentForm
                onSubmit={async values => {
                    await createTournament(values)
                }}
                submitLabel="Créer le Tournoi"
            />
        </div>
    )
}
