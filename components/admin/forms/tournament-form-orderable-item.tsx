/**
 * File: components/admin/forms/tournament-form-orderable-item.tsx
 * Description: Reusable ordered item layout with index badge, reorder arrows, content slot and delete button.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface OrderableItemProps {
  index: number
  total: number
  disabled?: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  removeLabel: string
  children: ReactNode
}

export const OrderableItem = ({
  index,
  total,
  disabled = false,
  onMoveUp,
  onMoveDown,
  onRemove,
  removeLabel,
  children,
}: OrderableItemProps) => {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/2 px-4 py-3">
      {/* Index badge */}
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-semibold text-zinc-500">
        #{index + 1}
      </span>

      {/* Reorder arrows */}
      <div className="flex shrink-0 flex-col gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={index === 0 || disabled}
          onClick={onMoveUp}
          className="text-zinc-500 hover:text-zinc-300"
          aria-label={`Monter l'élément ${index + 1}`}
        >
          <ChevronUp className="size-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={index === total - 1 || disabled}
          onClick={onMoveDown}
          className="text-zinc-500 hover:text-zinc-300"
          aria-label={`Descendre l'élément ${index + 1}`}
        >
          <ChevronDown className="size-3" />
        </Button>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">{children}</div>

      {/* Delete */}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={disabled}
        onClick={onRemove}
        className="shrink-0 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
        aria-label={removeLabel}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}
