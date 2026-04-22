/**
 * File: components/public/layout/navbar-mobile-menu.tsx
 * Description: Mobile Sheet menu with profile card and nav links for the public navbar.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import { NavbarProfile } from '@/components/public/layout/navbar-profile'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { AuthSession } from '@/lib/types/auth'
import { cn } from '@/lib/utils/cn'

interface NavLink {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavbarMobileMenuProps {
  navLinks: readonly NavLink[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isLinkActive: (href: string) => boolean
  sessionUser: AuthSession['user'] | null
}

export const NavbarMobileMenu = ({
  navLinks,
  isOpen,
  onOpenChange,
  isLinkActive,
  sessionUser,
}: NavbarMobileMenuProps) => (
  <Sheet open={isOpen} onOpenChange={onOpenChange}>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon" className="text-zinc-400">
        <Menu className="size-6" />
        <span className="sr-only">Toggle menu</span>
      </Button>
    </SheetTrigger>

    <SheetContent
      side="right"
      className="w-75 border-l border-white/10 bg-zinc-950/95 p-0 backdrop-blur-xl"
    >
      <VisuallyHidden>
        <SheetTitle>Menu de navigation mobile</SheetTitle>
      </VisuallyHidden>

      <div className="flex flex-col gap-6 px-4 pb-6 pt-16">
        <div className="flex justify-center">
          <NavbarProfile
            mode="mobile"
            onClick={() => onOpenChange(false)}
            sessionUser={sessionUser}
          />
        </div>

        <div className="flex flex-col gap-2">
          {navLinks.map(link => {
            const isActive = isLinkActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  'group relative flex items-center gap-4 rounded-full px-5 py-3 text-lg font-medium transition-colors duration-300',
                  isActive
                    ? 'bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)] ring-1 ring-blue-500/20'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white',
                )}
              >
                <span className="relative flex size-6 items-center justify-center">
                  <link.icon
                    className={cn(
                      'relative z-10 size-5 transition-all duration-300',
                      isActive
                        ? 'scale-110 text-blue-400'
                        : 'text-zinc-500 group-hover:-translate-y-0.5 group-hover:text-blue-300',
                    )}
                  />
                  {isActive && (
                    <span className="absolute inset-0 z-0 animate-pulse rounded-full bg-blue-500/40 blur-md" />
                  )}
                </span>
                <span className="relative z-10">{link.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </SheetContent>
  </Sheet>
)
