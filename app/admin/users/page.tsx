/**
 * File: app/admin/users/page.tsx
 * Description: Admin page for unified user management (players and admins).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Users } from 'lucide-react'
import type { Metadata } from 'next'
import { AdminContentLayout } from '@/components/features/admin/admin-content-layout'
import { UsersList } from '@/components/features/admin/users-list'
import { getSession } from '@/lib/services/auth'
import { getUsers } from '@/lib/services/users'
import { isOwner } from '@/lib/utils/owner'
import type { Role } from '@/prisma/generated/prisma/enums'

export const metadata: Metadata = {
  title: 'Utilisateurs',
}

const AdminUsersPage = async () => {
  const session = await getSession()
  const users = await getUsers()

  return (
    <AdminContentLayout
      segments={[{ label: 'Utilisateurs' }]}
      icon={Users}
      title="Utilisateurs"
      subtitle="Gérez tous les utilisateurs de la plateforme."
    >
      <UsersList
        users={users}
        viewerRole={session!.user.role as Role}
        viewerIsOwner={isOwner(session!.user.email)}
      />
    </AdminContentLayout>
  )
}

export default AdminUsersPage
