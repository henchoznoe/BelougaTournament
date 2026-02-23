/**
 * File: components/features/auth/session-info.tsx
 * Description: Client component displaying the current user session for debugging.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { LogOut } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/config/routes'
import { authClient } from '@/lib/core/auth-client'

const AVATAR_SIZE = 48

/** Displays the authenticated user info (name, avatar, role) or a login link. */
export const SessionInfo = () => {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/50 px-6 py-4 backdrop-blur-xl">
        <div className="size-12 animate-pulse rounded-full bg-zinc-700" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-32 animate-pulse rounded bg-zinc-700" />
          <div className="h-3 w-20 animate-pulse rounded bg-zinc-700" />
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-zinc-900/50 px-6 py-4 backdrop-blur-xl">
        <p className="text-sm text-zinc-400">Non connecté</p>
        <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Link href={ROUTES.LOGIN}>Se connecter</Link>
        </Button>
      </div>
    )
  }

  const { user } = session

  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-zinc-900/50 px-6 py-4 backdrop-blur-xl">
      {user.image && (
        <Image
          src={user.image}
          alt={user.name}
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
          className="rounded-full ring-2 ring-blue-500/30"
        />
      )}
      <div className="flex flex-col">
        <span className="font-medium text-white">{user.name}</span>
        <span className="text-xs text-zinc-400">{user.email}</span>
        <span className="mt-1 inline-flex w-fit rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20">
          {user.role}
        </span>
      </div>
      <form
        action={async () => {
          await authClient.signOut()
          window.location.href = ROUTES.HOME
        }}
      >
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="ml-4 text-zinc-400 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="mr-2 size-4" />
          Déconnexion
        </Button>
      </form>
    </div>
  )
}
