/**
 * File: components/public/layout/public-navbar-client.tsx
 * Description: Client-side interactive navbar with navigation, mobile sheet, and animations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { motion } from 'framer-motion'
import { BarChart3, Home, Mail, Trophy, Video } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { NavbarMobileMenu } from '@/components/public/layout/navbar-mobile-menu'
import { NavbarProfile } from '@/components/public/layout/navbar-profile'
import { ROUTES } from '@/lib/config/routes'
import { cn } from '@/lib/utils/cn'

const NAV_LINKS = [
  { href: ROUTES.HOME, label: 'Accueil', icon: Home },
  { href: ROUTES.TOURNAMENTS, label: 'Tournois', icon: Trophy },
  { href: ROUTES.LEADERBOARD, label: 'Classement', icon: BarChart3 },
  { href: ROUTES.STREAM, label: 'Stream', icon: Video },
  { href: ROUTES.CONTACT, label: 'Contact', icon: Mail },
] as const

interface PublicNavbarClientProps {
  logoUrl: string
}

export const PublicNavbarClient = ({ logoUrl }: PublicNavbarClientProps) => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isScrolled, setIsScrolled] = useState<boolean>(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isLinkActive = (href: string): boolean =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'fixed top-0 z-50 w-full py-4 transition-[background-color,backdrop-filter] duration-300',
        isScrolled &&
          'bg-zinc-950/80 backdrop-blur-md md:bg-transparent md:backdrop-blur-none',
      )}
    >
      <div className="container relative mx-auto flex h-14 items-center justify-between px-4">
        {/* Mobile left: text logo */}
        <Link href="/" className="flex items-center md:hidden">
          <span className="whitespace-nowrap font-paladins text-xl uppercase tracking-wider text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            Belouga
          </span>
        </Link>

        {/* Desktop center: logo + nav pill + profile */}
        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-3 md:flex">
          <Link
            href={ROUTES.HOME}
            className="group relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/5 bg-white/2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md transition-all duration-300 hover:bg-white/4 hover:ring-2 hover:ring-blue-500/20 focus:outline-hidden"
          >
            <Image
              src={logoUrl}
              alt="Belouga"
              width={32}
              height={32}
              loading="eager"
              className="rounded-full ring-2 ring-transparent transition-all duration-300 group-hover:scale-105"
            />
          </Link>

          <nav
            aria-label="Navigation principale"
            className="flex items-center gap-1 rounded-full border border-white/5 bg-white/2 p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md"
          >
            {NAV_LINKS.map(link => {
              const isActive = isLinkActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300',
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

          <NavbarProfile mode="desktop" />
        </div>

        {/* Mobile right: hamburger */}
        <div className="md:hidden">
          <NavbarMobileMenu
            navLinks={NAV_LINKS}
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            isLinkActive={isLinkActive}
          />
        </div>
      </div>
    </motion.header>
  )
}
