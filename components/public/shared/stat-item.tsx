/**
 * File: components/public/shared/stat-item.tsx
 * Description: Single landing statistic — server-rendered icon/label with an animated count.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { LucideIcon } from 'lucide-react'
import { CountUp } from '@/components/public/shared/count-up'

interface StatItemProps {
  value: number
  label: string
  /** Optional suffix appended after the number (e.g. "+"). */
  suffix?: string
  icon?: LucideIcon
}

export const StatItem = ({
  value,
  label,
  suffix,
  icon: Icon,
}: StatItemProps) => (
  <div className="flex flex-col items-center text-center">
    {Icon && (
      <span className="mb-3 inline-flex rounded-xl border border-brand/20 bg-brand/10 p-2.5">
        <Icon className="size-5 text-brand" />
      </span>
    )}
    <CountUp
      value={value}
      suffix={suffix}
      className="font-paladins text-4xl tracking-wider text-white sm:text-5xl"
    />
    <span className="mt-2 text-sm font-medium text-zinc-400">{label}</span>
  </div>
)
