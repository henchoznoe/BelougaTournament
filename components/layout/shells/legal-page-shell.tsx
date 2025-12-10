/**
 * File: components/layout/shells/legal-page-shell.tsx
 * Description: Reusable layout for legal and content pages (Rules, Terms, Privacy, etc.)
 * Author: Noé Henchoz
 * Date: 2025-12-08
 * License: MIT
 */

import { APP_METADATA } from '@/lib/config/constants'
import Image from 'next/image'
import type { ReactNode } from 'react'

interface LegalPageLayoutProps {
  title: string
  description?: string
  children: ReactNode
}

export const LegalPageLayout = ({
  title,
  description,
  children,
}: LegalPageLayoutProps) => {
  return (
    <div className="relative min-h-screen pb-24">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <Image
          alt="Belouga Tournament Arena Background"
          src={APP_METADATA.DEFAULT_BG_IMG}
          fill
          priority
          className="object-cover opacity-50"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-b from-zinc-950/80 via-zinc-950/50 to-zinc-950" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-top-8 duration-700">
          <h1 className="font-paladins text-4xl md:text-6xl text-white tracking-wider drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-lg text-zinc-400">{description}</p>
          )}
        </div>

        {/* Content Container */}
        <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl md:p-10">
            <div className="prose prose-invert max-w-none text-zinc-300">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
