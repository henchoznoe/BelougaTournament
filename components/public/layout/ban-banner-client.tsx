/**
 * File: components/public/layout/ban-banner-client.tsx
 * Description: Client component rendering the fixed bottom ban banner with a detail dialog on mobile.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { OctagonX } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface BanBannerClientProps {
  bannedUntil: string | null
  banReason: string | null
  formattedDate: string | null
}

export const BanBannerClient = ({
  bannedUntil,
  banReason,
  formattedDate,
}: BanBannerClientProps) => {
  const [open, setOpen] = useState(false)
  const isPermanent = !bannedUntil

  return (
    <>
      {/* Fixed bottom banner */}
      <div
        role="alert"
        className="fixed right-0 bottom-0 left-0 z-50 flex items-center gap-3 bg-red-900/95 px-4 py-3 text-sm text-white shadow-lg backdrop-blur-sm"
      >
        <OctagonX className="size-4 shrink-0 text-red-300" />

        {/* Desktop: full message */}
        <div className="hidden flex-1 sm:flex sm:flex-wrap sm:items-center sm:gap-1">
          <span className="font-semibold">Votre compte est suspendu.</span>
          {isPermanent ? (
            <span className="text-red-200">
              Vous ne pouvez pas vous inscrire à des tournois.
            </span>
          ) : (
            <span className="text-red-200">
              Suspension active jusqu&apos;au{' '}
              <span className="font-medium">{formattedDate}</span>. Vous ne
              pouvez pas vous inscrire à des tournois.
            </span>
          )}
          {banReason && (
            <span className="text-red-300/80 italic">Motif: {banReason}</span>
          )}
        </div>

        {/* Mobile: compact message + dialog trigger */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-1 items-center gap-1 text-left sm:hidden"
        >
          <span className="font-semibold">Vous êtes banni.</span>
          <span className="ml-1 text-red-200 underline underline-offset-2">
            Voir les détails
          </span>
        </button>
      </div>

      {/* Detail dialog (mobile) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <OctagonX className="size-5" />
              Compte suspendu
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-zinc-300">
            {isPermanent ? (
              <p>Votre compte est suspendu de manière permanente.</p>
            ) : (
              <p>
                Votre compte est suspendu jusqu&apos;au{' '}
                <span className="font-semibold text-white">
                  {formattedDate}
                </span>
                .
              </p>
            )}
            {banReason && (
              <div>
                <p className="font-medium text-zinc-400">Motif</p>
                <p className="mt-0.5 text-white">{banReason}</p>
              </div>
            )}
            <p className="text-zinc-500">
              Vous ne pouvez pas vous inscrire à des tournois tant que votre
              suspension est active.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Spacer so page content isn't hidden behind the fixed banner */}
      <div className="h-12" aria-hidden="true" />
    </>
  )
}
