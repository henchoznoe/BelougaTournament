/**
 * File: app/admin/admins/page.tsx
 * Description: Admins management page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Lock } from 'lucide-react'
import { headers } from 'next/headers'
import Link from 'next/link'
import { AdminsManager } from '@/components/features/admin/users/admins/admins-manager'
import { Button } from '@/components/ui/button'
import { APP_ROUTES } from '@/lib/config/routes'
import auth from '@/lib/core/auth'
import prisma from '@/lib/core/prisma'
import { Role } from '@/prisma/generated/prisma/enums'

const fetchUsers = async () => {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })
}

const AccessDeniedState = () => {
  return (
    <div className="flex h-[60vh] animate-in fade-in zoom-in duration-500 flex-col items-center justify-center space-y-4 text-center">
      <div className="flex size-20 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
        <Lock className="size-10 text-red-500" />
      </div>
      <h1 className="text-3xl font-bold text-white">
        Vous n'avez pas accès à cette page
      </h1>
      <p className="max-w-md text-zinc-400">
        Vous devez être connecté en tant que super admin pour accéder à cette
        page
      </p>
      <Button
        asChild
        variant="outline"
        className="border-white/10 text-white hover:bg-white/5"
      >
        <Link href={APP_ROUTES.ADMIN_DASHBOARD}>Retour au tableau de bord</Link>
      </Button>
    </div>
  )
}

const AdminsPage = async () => {
  // 1. Auth & Permission Check
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  const isSuperAdmin = session?.user?.role === Role.SUPERADMIN

  if (!isSuperAdmin) {
    return <AccessDeniedState />
  }

  // 2. Data Fetching
  const users = await fetchUsers()

  // 3. Render
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 text-4xl font-black tracking-tighter text-white">
            Gestion des administrateurs
          </h1>
          <p className="text-zinc-400">Gérez les administrateurs du tournoi</p>
        </div>
      </div>

      {/* Client Manager Component */}
      <AdminsManager
        users={users}
        currentUserId={session.user.id}
        currentUserRole={session.user.role as Role}
      />
    </div>
  )
}

export default AdminsPage
