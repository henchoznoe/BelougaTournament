/**
 * File: app/admin/users/[id]/page.tsx
 * Description: Admin page for viewing and managing a single user (detail view).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Users } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminContentLayout } from '@/components/features/admin/admin-content-layout'
import { UserDetail } from '@/components/features/admin/user-detail'
import { ROUTES } from '@/lib/config/routes'
import { getSession } from '@/lib/services/auth'
import { getUserById } from '@/lib/services/users'
import { isOwner } from '@/lib/utils/owner'

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params,
}: AdminUserDetailPageProps): Promise<Metadata> => {
  const { id } = await params
  const user = await getUserById(id)
  return {
    title: user ? user.name : 'Utilisateur introuvable',
  }
}

const AdminUserDetailPage = async ({ params }: AdminUserDetailPageProps) => {
  const { id } = await params
  const session = await getSession()
  const user = await getUserById(id)

  if (!user) {
    notFound()
  }

  return (
    <AdminContentLayout
      segments={[
        { label: 'Utilisateurs', href: ROUTES.ADMIN_USERS },
        { label: user.name },
      ]}
      icon={Users}
      title={user.name}
    >
      <UserDetail user={user} viewerIsOwner={isOwner(session!.user.email)} />
    </AdminContentLayout>
  )
}

export default AdminUserDetailPage
