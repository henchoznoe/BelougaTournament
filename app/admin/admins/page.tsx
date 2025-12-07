/**
 * File: app/admin/admins/page.tsx
 * Description: Page for managing administrators.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

import { Lock } from 'lucide-react'
import Link from 'next/link'
import { AdminsManager } from '@/components/features/admin/users/admins-manager'
import { Button } from '@/components/ui/button'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/db/prisma'
import { Role } from '@/prisma/generated/prisma/enums'

// Types
const CONTENT = {
  TITLE: 'Administrateurs',
  SUBTITLE: 'Gestion des comptes et des permissions.',
  ERR_ACCESS_TITLE: 'Accès Refusé',
  ERR_ACCESS_DESC:
    'Cette page est strictement réservée aux Super Administrateurs.',
  BTN_BACK: 'Retour au tableau de bord',
} as const

const ROUTES = {
  DASHBOARD: '/admin',
} as const

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
        {CONTENT.ERR_ACCESS_TITLE}
      </h1>
      <p className="max-w-md text-zinc-400">{CONTENT.ERR_ACCESS_DESC}</p>
      <Button
        asChild
        variant="outline"
        className="border-white/10 text-white hover:bg-white/5"
      >
        <Link href={ROUTES.DASHBOARD}>{CONTENT.BTN_BACK}</Link>
      </Button>
    </div>
  )
}

export default async function AdminsPage() {
  // 1. Auth & Permission Check
  const session = await getSession()
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
            {CONTENT.TITLE}
          </h1>
          <p className="text-zinc-400">{CONTENT.SUBTITLE}</p>
        </div>
      </div>

      {/* Client Manager Component */}
      <AdminsManager
        users={users}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
      />
    </div>
  )
}
