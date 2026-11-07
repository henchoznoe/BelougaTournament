/**
 * File: components/admin/ui/admin-page-skeleton.tsx
 * Description: Content-only loading states that preserve the administration shell.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Skeleton } from '@/components/ui/skeleton'

export const AdminPageSkeleton = ({
  variant = 'detail',
}: {
  variant?: 'list' | 'detail' | 'form'
}) => (
  <div
    role="status"
    aria-busy="true"
    className="mx-auto max-w-(--content-width) space-y-6"
  >
    <span className="sr-only">
      Chargement{' '}
      {variant === 'list'
        ? 'de la liste'
        : variant === 'form'
          ? 'du formulaire'
          : 'du contenu'}
      …
    </span>
    <div aria-hidden="true" className="space-y-6">
      <Skeleton className="h-4 w-48" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-11 w-32" />
      </div>
      {variant === 'list' ? (
        <>
          <Skeleton className="h-11 w-full" />
          {['first', 'second', 'third', 'fourth', 'fifth', 'sixth'].map(id => (
            <Skeleton key={id} className="h-20 w-full rounded-xl" />
          ))}
        </>
      ) : variant === 'form' ? (
        <>
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </>
      ) : (
        <>
          <Skeleton className="h-12 w-full" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </>
      )}
    </div>
  </div>
)
