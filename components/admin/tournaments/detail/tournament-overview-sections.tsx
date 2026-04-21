/**
 * File: components/admin/tournaments/detail/tournament-overview-sections.tsx
 * Description: Rich text sections, custom fields, and Toornament stages for the tournament detail view.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import {
  AlertTriangle,
  FileText,
  ImageIcon,
  Layers,
  Shield,
  Trophy,
} from 'lucide-react'
import { TournamentImageGallery } from '@/components/admin/tournaments/detail/tournament-image-gallery'
import { RichText } from '@/components/ui/rich-text'
import type { TournamentDetail as TournamentDetailType } from '@/lib/types/tournament'
import { TournamentStatus } from '@/prisma/generated/prisma/enums'

interface TournamentOverviewSectionsProps {
  tournament: TournamentDetailType
}

export const TournamentOverviewSections = ({
  tournament,
}: TournamentOverviewSectionsProps) => {
  const hasCustomFields = tournament.fields.length > 0
  const hasToornamentStages = tournament.toornamentStages.length > 0

  return (
    <>
      {/* Rich text sections */}
      {tournament.description && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <FileText className="size-4 text-blue-400" />
            Description
          </h2>
          <RichText content={tournament.description} />
        </div>
      )}

      {tournament.rules && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Shield className="size-4 text-blue-400" />
            Règles
          </h2>
          <RichText content={tournament.rules} />
        </div>
      )}

      {tournament.prize && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Trophy className="size-4 text-amber-400" />
            Prix
          </h2>
          <RichText content={tournament.prize} />
        </div>
      )}

      {/* Custom fields listing */}
      {hasCustomFields && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <FileText className="size-4 text-blue-400" />
            Champs personnalisés ({tournament.fields.length})
          </h2>
          <div className="space-y-2">
            {tournament.fields.map(field => (
              <div
                key={field.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/2 px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">#{field.order}</span>
                  <span className="text-sm font-medium text-zinc-200">
                    {field.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                    {field.type}
                  </span>
                  {field.required && (
                    <span className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                      Requis
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {tournament.status === TournamentStatus.PUBLISHED &&
            tournament._count.registrations > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
                <AlertTriangle className="size-3.5 shrink-0" />
                Les champs ne peuvent pas être modifiés car le tournoi est
                publié avec des inscrits.
              </div>
            )}
        </div>
      )}

      {/* Toornament stages */}
      {hasToornamentStages && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Layers className="size-4 text-blue-400" />
            Stages Toornament ({tournament.toornamentStages.length})
          </h2>
          <div className="space-y-2">
            {tournament.toornamentStages.map(stage => (
              <div
                key={stage.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/2 px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">#{stage.number}</span>
                  <span className="text-sm font-medium text-zinc-200">
                    {stage.name}
                  </span>
                </div>
                <span className="font-mono text-xs text-zinc-500">
                  {stage.stageId}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tournament images */}
      {tournament.imageUrls.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <ImageIcon className="size-4 text-blue-400" />
            Images
          </h2>
          <TournamentImageGallery
            imageUrls={tournament.imageUrls}
            name={tournament.title}
          />
        </div>
      )}
    </>
  )
}
