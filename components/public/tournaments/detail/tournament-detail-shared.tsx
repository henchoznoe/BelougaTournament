/**
 * File: components/public/tournaments/detail/tournament-detail-shared.tsx
 * Description: Shared primitive sub-components (QuickBadge, ContentCard, InfoRow) for the public tournament detail view.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import type React from 'react'
import { cn } from '@/lib/utils/cn'

// ─── QuickBadge ──────────────────────────────────────────────────────────────

interface QuickBadgeProps {
  icon: React.ComponentType<{ className?: string }>
  text: string
}

export const QuickBadge = ({ icon: Icon, text }: QuickBadgeProps) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-sm">
    <Icon className="size-3 text-zinc-500" />
    {text}
  </span>
)

// ─── ContentCard ─────────────────────────────────────────────────────────────

interface ContentCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
  className?: string
  titleExtra?: React.ReactNode
}

export const ContentCard = ({
  icon: Icon,
  title,
  children,
  className,
  titleExtra,
}: ContentCardProps) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8',
      className,
    )}
  >
    <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />
    <div className="relative z-10 space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
        <Icon className="size-4 text-blue-400" />
        {title}
        {titleExtra}
      </h3>
      {children}
    </div>
  </div>
)

// ─── InfoRow ─────────────────────────────────────────────────────────────────

interface InfoRowProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | React.ReactNode
}

export const InfoRow = ({ icon: Icon, label, value }: InfoRowProps) => (
  <div className="flex items-start gap-3 py-2.5">
    <Icon className="mt-0.5 size-4 shrink-0 text-blue-400" />
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
        {label}
      </p>
      <div className="text-sm text-zinc-300">{value}</div>
    </div>
  </div>
)
