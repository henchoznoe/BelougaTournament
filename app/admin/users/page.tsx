/**
 * File: app/admin/users/page.tsx
 * Description: Admin page for unified user management (players and admins).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Users } from 'lucide-react'
import type { Metadata } from 'next'
import { AdminContentLayout } from '@/components/admin/ui/admin-content-layout'
import { UsersList } from '@/components/admin/users/users-list'
import { getSession } from '@/lib/services/auth'
import { getUsers } from '@/lib/services/users'
import { isSuperAdmin } from '@/lib/utils/role'
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
        viewerIsSuperAdmin={isSuperAdmin(session?.user.role as Role)}
      />
    </AdminContentLayout>
  )
}

export default AdminUsersPage
