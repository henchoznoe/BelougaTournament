/**
 * File: components/admin/ui/admin-shell-skeleton.tsx
 * Description: Loading skeleton displayed while the admin shell resolves (auth check).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Skeleton } from '@/components/ui/skeleton'

export const AdminShellSkeleton = () => {
  return (
    <div className="flex h-dvh bg-zinc-950">
      {/* Sidebar skeleton (desktop only — always collapsed w-16) */}
      <aside className="hidden w-16 flex-col border-r border-white/5 bg-zinc-950/80 md:flex">
        {/* Logo area */}
        <div className="flex h-16 items-center justify-center border-b border-white/5 px-4">
          <Skeleton className="size-7 shrink-0 rounded bg-zinc-800" />
        </div>

        {/* Nav items (5 items matching ADMIN_NAV) */}
        <div className="flex-1 space-y-1 px-2 py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`nav-${i.toString()}`}
              className="flex items-center justify-center rounded-xl px-3 py-2.5"
            >
              <Skeleton className="size-5 shrink-0 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar skeleton */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-zinc-950/80 px-4 md:px-6">
          {/* Mobile menu button placeholder */}
          <div className="md:hidden">
            <Skeleton className="size-8 rounded bg-zinc-800" />
          </div>
          <div className="hidden md:block" />

          {/* Right side: back + logout + separator + user */}
          <div className="flex items-center gap-4">
            <Skeleton className="size-8 rounded bg-zinc-800" />
            <Skeleton className="size-8 rounded bg-zinc-800" />
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <Skeleton className="hidden h-4 w-20 rounded bg-zinc-800 sm:block" />
              <Skeleton className="size-8 rounded-full bg-zinc-800" />
            </div>
          </div>
        </header>

        {/* Content skeleton (matches dashboard: breadcrumb + heading + 2 stat cards + 2-col panels) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-6xl space-y-6">
            {/* Breadcrumb */}
            <Skeleton className="h-4 w-24 rounded bg-zinc-800" />

            {/* Page heading */}
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Skeleton className="size-6 rounded bg-zinc-800" />
                <Skeleton className="h-7 w-40 rounded bg-zinc-800" />
              </div>
              <Skeleton className="h-4 w-72 rounded bg-zinc-800" />
            </div>

            {/* Stats grid (2 cards) */}
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={`stat-${i.toString()}`}
                  className="rounded-2xl border border-white/5 bg-white/2 p-5 backdrop-blur-sm"
                >
                  <Skeleton className="h-3 w-28 rounded bg-zinc-800" />
                  <Skeleton className="mt-3 h-8 w-12 rounded bg-zinc-800" />
                  <Skeleton className="mt-2 h-3 w-48 rounded bg-zinc-800" />
                </div>
              ))}
            </div>

            {/* Two-column panels */}
            <div className="grid gap-6 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={`panel-${i.toString()}`}
                  className="rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <Skeleton className="size-4 rounded bg-zinc-800" />
                    <Skeleton className="h-4 w-36 rounded bg-zinc-800" />
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div
                        key={`row-${i.toString()}-${j.toString()}`}
                        className="flex items-center gap-3"
                      >
                        <Skeleton className="size-8 rounded-full bg-zinc-800" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-3 w-28 rounded bg-zinc-800" />
                          <Skeleton className="h-2.5 w-20 rounded bg-zinc-800" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
