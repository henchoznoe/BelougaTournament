/**
 * File: components/ui/action-feedback.tsx
 * Description: Persistent and accessible action results and recovery messages.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface ActionFeedbackProps {
  tone?: 'info' | 'success' | 'error'
  title: string
  children?: ReactNode
  className?: string
}

export const ActionFeedback = ({
  tone = 'info',
  title,
  children,
  className,
}: ActionFeedbackProps) => {
  const Icon =
    tone === 'error' ? CircleAlert : tone === 'success' ? CircleCheck : Info
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'min-w-0 rounded-2xl border p-4 text-sm',
        tone === 'error'
          ? 'border-red-400/30 bg-red-400/5 text-red-200'
          : tone === 'success'
            ? 'border-emerald-400/30 bg-emerald-400/5 text-emerald-200'
            : 'border-brand/30 bg-brand/5 text-zinc-200',
        className,
      )}
    >
      <p className="flex items-start gap-2 font-semibold">
        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {title}
      </p>
      {children && (
        <div className="mt-2 space-y-3 leading-relaxed">{children}</div>
      )}
    </div>
  )
}
