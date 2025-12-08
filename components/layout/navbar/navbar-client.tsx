/**
 * File: components/layout/navbar/navbar-client.tsx
 * Description: Interactive Navbar component handling navigation, mobile sheet, and animations.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

"use client"

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { useState } from "react"
import { usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Menu, Trophy, Video, Mail, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { APP_METADATA } from "@/lib/constants"
import { APP_ROUTES } from "@/lib/config/routes"
import { fr } from "@/lib/i18n/dictionaries/fr"

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

interface NavbarClientProps {
  settings: {
    logoUrl: string | null
  }
}

interface NavLogoProps {
  url: string | null
  size?: number
  className?: string
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const NAV_LINKS = [
  { href: APP_ROUTES.HOME, label: fr.layout.navbar.links.home, icon: Home },
  { href: APP_ROUTES.TOURNAMENTS, label: fr.layout.navbar.links.tournaments, icon: Trophy },
  { href: APP_ROUTES.STREAM, label: fr.layout.navbar.links.stream, icon: Video },
  { href: APP_ROUTES.CONTACT, label: fr.layout.navbar.links.contact, icon: Mail },
] as const

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const NavLogo = ({ url, size = 48, className }: NavLogoProps) => {
  const src = url || APP_METADATA.DEFAULT_LOGO

  return (
    <div className="relative">
      <Image
        src={src}
        alt={APP_METADATA.NAME}
        width={size}
        height={size}
        className={cn('h-auto w-auto transition-transform duration-300', className)}
        style={{ height: size, width: 'auto' }}
      />
      <div className="absolute inset-0 -z-10 rounded-full bg-blue-500/20 blur-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  )
}

export const NavbarClient = ({ settings }: NavbarClientProps) => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const isLinkActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-md supports-backdrop-filter:bg-zinc-950/60"
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-3">
          <div className="hidden md:block">
            <NavLogo
              url={settings.logoUrl}
              className="group-hover:scale-110"
            />
          </div>
          <span className="whitespace-nowrap font-paladins text-md tracking-wider text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300 group-hover:drop-shadow-[0_0_25px_rgba(59,130,246,0.8)] md:text-2xl">
            {APP_METADATA.NAME}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = isLinkActive(link.href)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'group relative flex items-center gap-2 text-sm font-medium transition-colors duration-300',
                  isActive ? 'text-blue-400' : 'text-zinc-400 hover:text-white'
                )}
              >
                <link.icon
                  className={cn(
                    'size-4 transition-transform duration-300 group-hover:-translate-y-0.5',
                    isActive ? 'text-blue-400' : 'text-zinc-500 group-hover:text-blue-400'
                  )}
                />
                {link.label}
                <span
                  className={cn(
                    'absolute -bottom-1 left-0 h-0.5 bg-blue-500 transition-all duration-300',
                    isActive ? 'w-full' : 'w-0 group-hover:w-full'
                  )}
                />
              </Link>
            )
          })}
        </nav>

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
              className="w-[300px] border-l border-white/10 bg-zinc-950/95 p-0 backdrop-blur-xl"
            >
              <SheetHeader className="border-b border-white/10 p-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="group">
                    <NavLogo url={settings.logoUrl} size={64} />
                  </div>
                  <SheetTitle className="font-paladins text-2xl tracking-wider text-white text-center">
                    {APP_METADATA.NAME}
                  </SheetTitle>
                </div>
              </SheetHeader>

              <div className="flex flex-col gap-2 px-2 py-6">
                {NAV_LINKS.map((link) => {
                  const isActive = isLinkActive(link.href)

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'group flex items-center gap-4 rounded-lg px-4 py-3 text-lg font-medium transition-all duration-300',
                        isActive
                          ? 'bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                          : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <link.icon
                        className={cn(
                          'size-5 transition-colors',
                          isActive ? 'text-blue-400' : 'text-zinc-500 group-hover:text-blue-400'
                        )}
                      />
                      {link.label}
                      {isActive && (
                        <div className="ml-auto size-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  )
}
