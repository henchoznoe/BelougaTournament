/**
 * File: components/features/auth/login-card.tsx
 * Description: Visual wrapper for the login form with header and styling.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

import { Gamepad2 } from 'lucide-react'
import type { ReactNode } from 'react'

const CONTENT = {
  TITLE: 'Admin Login',
  SUBTITLE: 'Accès réservé aux administrateurs',
} as const

interface LoginCardProps {
  children: ReactNode
}

export function LoginCard({ children }: LoginCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 shadow-2xl backdrop-blur-xl">
      <div className="p-8">
        {/* Card Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/20">
            <Gamepad2 className="size-8 text-blue-400" />
          </div>
          <h1 className="font-paladins text-3xl tracking-wider text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            {CONTENT.TITLE}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">{CONTENT.SUBTITLE}</p>
        </div>

        {/* Content */}
        {children}
      </div>

      {/* Decorative Footer Line */}
      <div className="h-1 w-full bg-linear-to-r from-transparent via-blue-500/50 to-transparent" />
    </div>
  )
}
