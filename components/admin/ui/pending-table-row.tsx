/**
 * File: components/admin/ui/pending-table-row.tsx
 * Description: Clickable table rows retaining native links and immediate navigation feedback.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { useRouter } from 'next/navigation'
import {
  Children,
  type ComponentProps,
  cloneElement,
  isValidElement,
  type ReactNode,
  useTransition,
} from 'react'
import { TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils/cn'

export const PendingTableRow = ({
  href,
  className,
  children,
  ...props
}: ComponentProps<'tr'> & { href: string }) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <TableRow
      {...props}
      aria-busy={pending}
      data-pending={pending || undefined}
      className={cn(
        'group/row cursor-pointer border-white/10 hover:bg-white/5 focus-within:bg-white/5',
        pending && 'animate-pulse bg-brand/10',
        className,
      )}
      onClick={event => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          (event.target as Element).closest(
            'a,button,input,select,[role="button"],[role="menuitem"]',
          )
        )
          return
        if (!pending) startTransition(() => router.push(href))
      }}
    >
      {Children.map(children, (child, index) =>
        pending &&
        index === 0 &&
        isValidElement<{ children?: ReactNode }>(child)
          ? cloneElement(
              child,
              {},
              child.props.children,
              <span
                key="navigation-status"
                role="status"
                className="mt-1 block text-xs font-medium text-blue-300"
              >
                Chargement du détail…
              </span>,
            )
          : child,
      )}
    </TableRow>
  )
}
