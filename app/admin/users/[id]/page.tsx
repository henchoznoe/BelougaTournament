/**
 * File: app/admin/users/[id]/page.tsx
 * Description: Admin page for viewing user details with profile, role toggle, stats, and registrations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Users } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminContentLayout } from '@/components/admin/ui/admin-content-layout'
import { UserDetail } from '@/components/admin/users/user-detail'
import {
  UserDetailActions,
  UserRoleBadge,
} from '@/components/admin/users/user-detail-actions'
import { ROUTES } from '@/lib/config/routes'
import { getSession } from '@/lib/services/auth'
import { getUserById } from '@/lib/services/users'
import { isSuperAdmin } from '@/lib/utils/role'
import type { Role } from '@/prisma/generated/prisma/enums'

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params,
}: AdminUserDetailPageProps): Promise<Metadata> => {
  const { id } = await params
  const user = await getUserById(id)
  return {
    title: user ? user.displayName || user.name : 'Utilisateur introuvable',
  }
}

const AdminUserDetailPage = async ({ params }: AdminUserDetailPageProps) => {
  const { id } = await params
  const [user, session] = await Promise.all([getUserById(id), getSession()])

  if (!user) {
    notFound()
  }

  const viewerIsSuperAdmin = isSuperAdmin(session?.user?.role as Role)

  return (
    <AdminContentLayout
      segments={[
        { label: 'Utilisateurs', href: ROUTES.ADMIN_USERS },
        { label: user.displayName || user.name },
      ]}
      icon={Users}
      title={user.displayName || user.name}
      subtitle={`@${user.name}`}
      titleExtra={
        <UserRoleBadge user={user} isSuperAdmin={viewerIsSuperAdmin} />
      }
      headerRight={
        <UserDetailActions user={user} isSuperAdmin={viewerIsSuperAdmin} />
      }
    >
      <UserDetail user={user} />
    </AdminContentLayout>
  )
}

export default AdminUserDetailPage
