/**
 * File: app/admin/users/page.tsx
 * Description: Admin page for unified user management (players, admins, super admins).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Users } from 'lucide-react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { UsersList } from '@/components/features/admin/users-list'
import { ROUTES } from '@/lib/config/routes'
import { getSession } from '@/lib/services/auth'
import { getUsers } from '@/lib/services/users'
import { isOwner } from '@/lib/utils/owner'
import type { Role } from '@/prisma/generated/prisma/enums'

export const metadata: Metadata = {
  title: 'Utilisateurs',
}

const AdminUsersPage = async () => {
  const session = await getSession()

  if (!session?.user) {
    redirect(ROUTES.LOGIN)
  }

  const users = await getUsers()

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page heading */}
      <div className="space-y-1">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
          <Users className="size-6 text-blue-400" />
          Utilisateurs
        </h1>
        <p className="text-sm text-zinc-400">
          Gérez tous les utilisateurs de la plateforme.
        </p>
      </div>

      <UsersList
        users={users}
        viewerRole={session.user.role as Role}
        viewerIsOwner={isOwner(session.user.email)}
      />
    </div>
  )
}

export default AdminUsersPage
