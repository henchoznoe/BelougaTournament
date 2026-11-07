/**
 * File: components/ui/pending-link.tsx
 * Description: Accessible Next.js link with feedback during client navigation.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Loader2 } from 'lucide-react'
import Link, { useLinkStatus } from 'next/link'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils/cn'

const LinkProgress = () => {
  const { pending } = useLinkStatus()
  return pending ? (
    <span
      role="status"
      className="pointer-events-none absolute right-1 top-1 z-20 inline-flex shrink-0 items-center rounded-full bg-zinc-950 p-1 text-blue-300"
    >
      <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      <span className="sr-only">Chargement de la page…</span>
    </span>
  ) : null
}

export const PendingLink = ({
  children,
  className,
  ...props
}: ComponentProps<typeof Link>) => (
  <Link className={cn('pending-link relative', className)} {...props}>
    {children}
    <LinkProgress />
  </Link>
)
