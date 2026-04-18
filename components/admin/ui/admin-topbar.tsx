/**
 * File: components/admin/ui/admin-topbar.tsx
 * Description: Top navigation bar for the admin panel.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ArrowLeft, Menu } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ROUTES } from '@/lib/config/routes'
import { authClient } from '@/lib/core/auth-client'
import { cn } from '@/lib/utils/cn'

interface AdminTopbarProps {
  onMobileMenuToggle: () => void
}

export const AdminTopbar = ({ onMobileMenuToggle }: AdminTopbarProps) => {
  const { data: session, isPending } = authClient.useSession()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-zinc-950/80 px-4 backdrop-blur-xl md:px-6">
      {/* Left: Mobile menu button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 md:hidden"
          onClick={onMobileMenuToggle}
        >
          <Menu className="size-5" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
      </div>

      {/* Right: User info + Back to site */}
      <div className="flex items-center gap-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 text-zinc-400"
        >
          <Link href={ROUTES.HOME}>
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Retour au site</span>
            <span className="sr-only sm:hidden">Retour au site</span>
          </Link>
        </Button>

        <div className="h-6 w-px bg-white/10" />

        {isPending ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-20 rounded bg-zinc-800" />
            <Skeleton className="size-8 rounded-full bg-zinc-800" />
          </div>
        ) : session?.user ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={ROUTES.PROFILE}
                className="flex items-center gap-3 rounded-xl px-3 py-1.5 transition-colors duration-200 hover:bg-white/5"
              >
                <span
                  className={cn(
                    'hidden text-sm font-medium text-zinc-300 sm:block',
                  )}
                >
                  {session.user.displayName}
                </span>
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.displayName}
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-white/10"
                  />
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full bg-zinc-800 ring-2 ring-white/10">
                    <span className="text-xs font-medium text-zinc-300">
                      {session.user.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8}>
              Mon profil
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </header>
  )
}
