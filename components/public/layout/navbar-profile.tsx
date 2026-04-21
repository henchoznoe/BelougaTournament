/**
 * File: components/public/layout/navbar-profile.tsx
 * Description: Auth-aware profile button for the public navbar (desktop dropdown + mobile card).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { LayoutDashboard, LogOut, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLogout } from '@/components/admin/hooks/use-logout'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { ROUTES } from '@/lib/config/routes'
import { authClient } from '@/lib/core/auth-client'
import { Role } from '@/prisma/generated/prisma/enums'

interface NavbarProfileProps {
  onClick?: () => void
  mode?: 'desktop' | 'mobile'
}

export const NavbarProfile = ({
  onClick,
  mode = 'desktop',
}: NavbarProfileProps) => {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { handleLogout: logout } = useLogout({
    onSuccess: () => {
      router.refresh()
      if (onClick) onClick()
    },
  })

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
        aria-label="Se connecter"
      >
        <User className="size-5 text-zinc-400 transition-colors duration-300 group-hover:text-white" />
      </Link>
    )
  }

  const isAdmin = session.user.role === Role.ADMIN

  // Desktop: dropdown
  if (mode === 'desktop') {
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="group relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/5 bg-white/2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md transition-all duration-300 hover:bg-white/4 hover:ring-2 hover:ring-blue-500/20 focus:outline-hidden">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.displayName || session.user.name}
              width={32}
              height={32}
              className="rounded-full ring-2 ring-transparent transition-all duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="text-sm font-medium text-zinc-300">
              {session.user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 border-white/10 bg-zinc-950/90 text-zinc-200 backdrop-blur-xl"
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none text-white">
                {session.user.displayName || session.user.name}
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
            onClick={logout}
          >
            <LogOut className="mr-2 size-4" />
            <span>Déconnexion</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Mobile: inline card
  return (
    <div className="flex w-full flex-col gap-4 rounded-3xl border border-white/5 bg-white/2 p-4">
      <div className="flex items-center gap-4">
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.displayName}
            width={48}
            height={48}
            className="rounded-full ring-2 ring-blue-500/20"
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-full bg-zinc-800 ring-2 ring-blue-500/20">
            <span className="text-lg font-medium text-zinc-300">
              {session.user.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="text-lg font-bold text-white">
          {session.user.displayName}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <Button
          asChild
          variant="ghost"
          className="h-10 justify-start gap-3 px-2 text-zinc-300"
          onClick={onClick}
        >
          <Link href={ROUTES.PROFILE}>
            <User className="size-4" />
            Mon Profil
          </Link>
        </Button>
        {isAdmin && (
          <Button
            asChild
            variant="ghost"
            className="h-10 justify-start gap-3 px-2 text-zinc-300"
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
          className="mt-2 h-10 justify-start gap-3 px-2 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          onClick={logout}
        >
          <LogOut className="size-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  )
}
