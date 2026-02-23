/**
 * File: app/(admin)/page.tsx
 * Description: Admin dashboard placeholder page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ArrowLeft, Shield } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/config/routes'
import { getSession } from '@/lib/services/auth.service'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
}

/** Placeholder admin dashboard showing the authenticated user info. */
const AdminDashboardPage = async () => {
  const session = await getSession()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4">
      <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
        <Shield className="size-8 text-green-400" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Bienvenue, {session?.user.name}
        </p>
      </div>
      <div className="rounded-xl border border-white/10 bg-zinc-900/50 px-6 py-4 backdrop-blur-xl">
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-zinc-400">Rôle :</dt>
            <dd className="font-medium text-white">{session?.user.role}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-zinc-400">Email :</dt>
            <dd className="font-medium text-white">{session?.user.email}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-zinc-400">Discord ID :</dt>
            <dd className="font-medium text-white">
              {session?.user.discordId ?? 'N/A'}
            </dd>
          </div>
        </dl>
      </div>
      <Button
        asChild
        variant="ghost"
        className="mt-4 text-zinc-400 hover:bg-white/5 hover:text-white"
      >
        <Link href={ROUTES.HOME}>
          <ArrowLeft className="mr-2 size-4" />
          Retour à l'accueil
        </Link>
      </Button>
    </div>
  )
}

export default AdminDashboardPage
