/**
 * File: components/public/tournaments/detail/tournament-detail-shared.tsx
 * Description: Shared primitive sub-components (QuickBadge, StatCard, ContentCard, DateRow) for the public tournament detail view.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import type React from 'react'

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

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}

export const StatCard = ({ icon: Icon, label, value }: StatCardProps) => (
  <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/2 p-4 transition-colors duration-300 hover:border-white/10 hover:bg-white/4">
    <div className="pointer-events-none absolute -right-4 -top-4 size-16 rounded-full bg-blue-500/5 blur-2xl transition-all duration-300 group-hover:bg-blue-500/10" />
    <div className="relative z-10">
      <Icon className="mb-2 size-4 text-blue-400" />
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
        {label}
      </p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  </div>
)

// ─── ContentCard ─────────────────────────────────────────────────────────────

interface ContentCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}

export const ContentCard = ({
  icon: Icon,
  title,
  children,
}: ContentCardProps) => (
  <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/2 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8">
    <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-500/5 blur-3xl" />
    <div className="relative z-10 space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
        <Icon className="size-4 text-blue-400" />
        {title}
      </h3>
      {children}
    </div>
  </div>
)

// ─── DateRow ──────────────────────────────────────────────────────────────────

interface DateRowProps {
  label: string
  value: string
}

export const DateRow = ({ label, value }: DateRowProps) => (
  <div className="rounded-2xl border border-white/5 bg-white/2 px-4 py-3">
    <span className="text-[10px] uppercase tracking-wider text-zinc-600">
      {label}
    </span>
    <p className="text-sm text-zinc-300">{value}</p>
  </div>
)
