/**
 * File: components/features/auth/login-card.tsx
 * Description: Visual wrapper for the login form with header and styling.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import type { ReactNode } from 'react'
import { Gamepad2 } from 'lucide-react'
import { fr } from "@/lib/i18n/dictionaries/fr"

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

interface LoginCardProps {
  children: ReactNode
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------



// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

export const LoginCard = ({ children }: LoginCardProps) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 shadow-2xl backdrop-blur-xl">
      <div className="p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/20">
            <Gamepad2 className="size-8 text-blue-400" />
          </div>
          <h1 className="font-paladins text-3xl tracking-wider text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            {fr.pages.login.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">{fr.pages.login.subtitle}</p>
        </div>

        {children}
      </div>

      <div className="h-1 w-full bg-linear-to-r from-transparent via-blue-500/50 to-transparent" />
    </div>
  )
}
