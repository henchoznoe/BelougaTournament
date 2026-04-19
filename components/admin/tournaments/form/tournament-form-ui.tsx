/**
 * File: components/admin/tournaments/form/tournament-form-ui.tsx
 * Description: Shared UI constants and small components for the tournament form sections.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ─── Styling constants ──────────────────────────────────────────────────────

export const INPUT_CLASSES =
  'h-10 rounded-xl border-white/10 bg-white/5 text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:border-blue-500/30 focus-visible:ring-blue-500/20'

export const LABEL_CLASSES = 'text-xs font-medium text-zinc-400'

export const SECTION_CLASSES =
  'rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm'

// ─── Section Header ─────────────────────────────────────────────────────────

interface SectionHeaderProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  color?: string
}

export const SectionHeader = ({
  icon: Icon,
  title,
  color = 'text-blue-400',
}: SectionHeaderProps) => (
  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-300">
    <Icon className={cn('size-4', color)} />
    {title}
  </h2>
)

// ─── Locked Field Indicator ─────────────────────────────────────────────────

export const LockedIndicator = () => (
  <span className="inline-flex items-center gap-1 text-[10px] text-zinc-600">
    <Lock className="size-2.5" />
    Verrouillé
  </span>
)
