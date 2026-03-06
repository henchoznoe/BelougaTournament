/**
 * File: components/features/layout/public-navbar.tsx
 * Description: Interactive Navbar component handling navigation, mobile sheet, and animations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Home,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Trophy,
  User,
  Video,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/lib/config/routes'
import { authClient } from '@/lib/core/auth-client'
import { cn } from '@/lib/utils/cn'
import { Role } from '@/prisma/generated/prisma/enums'

const NavbarProfile = ({
  onClick,
  mode = 'desktop',
}: {
  onClick?: () => void
  mode?: 'desktop' | 'mobile'
}) => {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success('Déconnexion réussie')
            router.refresh()
            if (onClick) onClick()
          },
          onError: ctx => {
            console.error('Logout error:', ctx.error)
            toast.error('Erreur lors de la déconnexion')
          },
        },
      })
    } catch (error) {
      console.error('Unexpected logout error:', error)
      toast.error('Une erreur inattendue est survenue')
    }
  }

  if (isPending) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/5 bg-white/2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md">
        <Skeleton className="size-5 rounded-full bg-zinc-700" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <Link
        href={`${ROUTES.LOGIN}?from=${encodeURIComponent(pathname)}`}
        onClick={onClick}
        className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-white/5 bg-white/2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md transition-colors duration-300 hover:bg-white/4"
        title="Se connecter"
        aria-label="Se connecter"
      >
        <User className="size-5 text-zinc-400 transition-colors duration-300 group-hover:text-white" />
      </Link>
    )
  }

  const isAdmin =
    session.user.role === Role.ADMIN || session.user.role === Role.SUPERADMIN

  // Desktop Dropdown
  if (mode === 'desktop') {
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-white/5 bg-white/2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md transition-all duration-300 hover:bg-white/4 hover:ring-2 hover:ring-blue-500/20 focus:outline-hidden cursor-pointer">
          <Image
            src={session.user.image ?? ''}
            alt={session.user.name}
            width={32}
            height={32}
            className="rounded-full ring-2 ring-transparent transition-all duration-300 group-hover:scale-105"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 border-white/10 bg-zinc-950/90 text-zinc-200 backdrop-blur-xl"
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="font-medium text-sm leading-none text-white">
                {session.user.displayName}
              </p>
              <p className="text-xs leading-none text-zinc-400">
                {session.user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem
            asChild
            className="cursor-pointer focus:bg-white/5 focus:text-white"
          >
            <Link href={ROUTES.PROFILE} className="w-full">
              <User className="mr-2 size-4" />
              <span>Mon Profil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="cursor-pointer focus:bg-white/5 focus:text-white"
          >
            <Link href={`${ROUTES.PROFILE}#inscriptions`} className="w-full">
              <Trophy className="mr-2 size-4" />
              <span>Mes Inscriptions</span>
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild>
                <Link
                  href={ROUTES.ADMIN_DASHBOARD}
                  className="w-full cursor-pointer focus:bg-white/5 focus:text-white"
                >
                  <LayoutDashboard className="mr-2 size-4" />
                  <span>Tableau de bord</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem
            className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-300"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 size-4" />
            <span>Déconnexion</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Mobile List
  return (
    <div className="flex w-full flex-col gap-4 rounded-3xl border border-white/5 bg-white/2 p-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Image
            src={session.user.image ?? ''}
            alt={session.user.displayName}
            width={48}
            height={48}
            className="rounded-full ring-2 ring-blue-500/20"
          />
        </div>
        <span className="font-bold text-white text-lg">
          {session.user.displayName}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <Button
          asChild
          variant="ghost"
          className="justify-start gap-3 h-10 px-2 text-zinc-300 hover:bg-white/5 hover:text-white"
          onClick={onClick}
        >
          <Link href={ROUTES.PROFILE}>
            <User className="size-4" />
            Mon Profil
          </Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          className="justify-start gap-3 h-10 px-2 text-zinc-300 hover:bg-white/5 hover:text-white"
          onClick={onClick}
        >
          <Link href={`${ROUTES.PROFILE}#inscriptions`}>
            <Trophy className="size-4" />
            Mes Inscriptions
          </Link>
        </Button>
        {isAdmin && (
          <Button
            asChild
            variant="ghost"
            className="justify-start gap-3 h-10 px-2 text-zinc-300 hover:bg-white/5 hover:text-white"
            onClick={onClick}
          >
            <Link href={ROUTES.ADMIN_DASHBOARD}>
              <LayoutDashboard className="size-4" />
              Dashboard Admin
            </Link>
          </Button>
        )}
        <Button
          variant="ghost"
          className="justify-start gap-3 h-10 px-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 mt-2"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  )
}

export const PublicNavbar = () => {
  const NAV_LINKS = [
    { href: ROUTES.HOME, label: 'Accueil', icon: Home },
    { href: ROUTES.TOURNAMENTS, label: 'Tournois', icon: Trophy },
    { href: ROUTES.LEADERBOARD, label: 'Classement', icon: BarChart3 },
    { href: ROUTES.STREAM, label: 'Stream', icon: Video },
    { href: ROUTES.CONTACT, label: 'Contact', icon: Mail },
  ] as const

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
        {/* Mobile Left: Text Logo */}
        <Link href="/" className="flex items-center md:hidden">
          <span className="whitespace-nowrap font-paladins text-xl tracking-wider text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] uppercase">
            Belouga
          </span>
        </Link>
        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-3 md:flex">
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
              <VisuallyHidden>
                <SheetTitle>Menu de navigation mobile</SheetTitle>
              </VisuallyHidden>

              <div className="flex flex-col gap-6 px-4 pb-6 pt-16">
                <div className="flex justify-center">
                  {/* Reuse the matching profile component */}
                  <NavbarProfile
                    mode="mobile"
                    onClick={() => setIsOpen(false)}
                  />
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
