/**
 * File: components/features/layout/public-navbar.tsx
 * Description: Interactive Navbar component handling navigation, mobile sheet, and animations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { motion } from 'framer-motion'
import { Home, Mail, Menu, Trophy, User, Video } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ROUTES } from '@/lib/config/routes'
import { authClient } from '@/lib/core/auth-client'
import { cn } from '@/lib/utils/cn'

const NavbarProfile = () => {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/5 bg-white/2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md">
        <div className="size-5 animate-pulse rounded-full bg-zinc-700" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <Link
        href={ROUTES.LOGIN}
        className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-white/5 bg-white/2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md transition-colors duration-300 hover:bg-white/4"
        title="Se connecter"
      >
        <User className="size-5 text-zinc-400 transition-colors duration-300 group-hover:text-white" />
      </Link>
    )
  }

  return (
    <Link
      href={ROUTES.ADMIN_DASHBOARD}
      className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-white/5 bg-white/2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md transition-colors duration-300 hover:bg-white/4"
      title="Profil"
    >
      <Image
        src={session.user.image || ''}
        alt={session.user.name}
        width={32}
        height={32}
        className="rounded-full ring-2 ring-transparent transition-all duration-300 group-hover:ring-blue-500/30"
      />
    </Link>
  )
}

export const PublicNavbar = () => {
  const NAV_LINKS = [
    { href: ROUTES.HOME, label: 'Accueil', icon: Home },
    { href: ROUTES.TOURNAMENTS, label: 'Tournois', icon: Trophy },
    { href: ROUTES.STREAM, label: 'Stream', icon: Video },
    { href: ROUTES.CONTACT, label: 'Contact', icon: Mail },
  ] as const

  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const isLinkActive = (href: string): boolean =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-md supports-backdrop-filter:bg-zinc-950/60"
    >
      <div className="container relative mx-auto flex h-20 items-center justify-between px-4">
        {/* Mobile Left: Text Logo */}
        <Link href="/" className="flex items-center md:hidden">
          <span className="whitespace-nowrap font-paladins text-xl tracking-wider text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] uppercase">
            Belouga
          </span>
        </Link>
        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-3 md:flex">
          <nav className="flex items-center gap-1 rounded-full border border-white/5 bg-white/2 p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md">
            {NAV_LINKS.map(link => {
              const isActive = isLinkActive(link.href)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'group relative flex items-center gap-2.5 rounded-full px-5 py-2 text-sm font-medium transition-colors duration-300',
                    isActive
                      ? 'text-white'
                      : 'text-zinc-400 hover:bg-white/4 hover:text-white',
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="desktop-active-nav-bg"
                      className="absolute inset-0 z-0 rounded-full border border-blue-500/20 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}

                  <span className="relative z-10 flex items-center gap-2.5">
                    <span className="relative flex size-5 items-center justify-center">
                      <link.icon
                        className={cn(
                          'relative z-10 size-4 transition-all duration-300',
                          isActive
                            ? 'scale-110 text-blue-400'
                            : 'text-zinc-500 group-hover:-translate-y-0.5 group-hover:text-blue-300',
                        )}
                      />
                      {isActive && (
                        <span className="absolute inset-0 z-0 animate-pulse rounded-full bg-blue-500/40 blur-md" />
                      )}
                    </span>
                    {link.label}
                  </span>
                </Link>
              )
            })}
          </nav>

          <NavbarProfile />
        </div>

        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <Menu className="size-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-75 border-l border-white/10 bg-zinc-950/95 p-0 backdrop-blur-xl"
            >
              <div className="flex flex-col gap-6 px-4 pb-6 pt-16">
                <div className="flex justify-center">
                  {/* Reuse the matching profile component */}
                  <NavbarProfile />
                </div>

                <div className="flex flex-col gap-2">
                  {NAV_LINKS.map(link => {
                    const isActive = isLinkActive(link.href)

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
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
        </div>
      </div>
    </motion.header>
  )
}
