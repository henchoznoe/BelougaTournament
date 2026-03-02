/**
 * File: components/features/legal/legal-section.tsx
 * Description: Reusable glassmorphism section for legal pages.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { ReactNode } from 'react'

interface LegalSectionProps {
  title: string
  children: ReactNode
}

export const LegalSection = ({ title, children }: LegalSectionProps) => {
  return (
    <section className="rounded-xl border border-white/5 bg-white/2 p-6 backdrop-blur sm:p-8">
      <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-zinc-400">
        {children}
      </div>
    </section>
  )
}
