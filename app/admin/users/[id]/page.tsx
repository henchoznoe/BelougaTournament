/**
 * File: app/admin/users/[id]/page.tsx
 * Description: Admin page for viewing user details (placeholder).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Users } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminContentLayout } from '@/components/admin/ui/admin-content-layout'
import { ROUTES } from '@/lib/config/routes'
import { getUserById } from '@/lib/services/users'

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params,
}: AdminUserDetailPageProps): Promise<Metadata> => {
  const { id } = await params
  const user = await getUserById(id)
  return {
    title: user ? (user.displayName ?? user.name) : 'Utilisateur introuvable',
  }
}

const AdminUserDetailPage = async ({ params }: AdminUserDetailPageProps) => {
  const { id } = await params
  const user = await getUserById(id)

  if (!user) {
    notFound()
  }

  return (
    <AdminContentLayout
      segments={[
        { label: 'Utilisateurs', href: ROUTES.ADMIN_USERS },
        { label: user.displayName ?? user.name },
      ]}
      icon={Users}
      title={user.displayName ?? user.name}
    >
      <div className="rounded-2xl border border-white/5 bg-white/2 p-8 text-center backdrop-blur-sm">
        <p className="text-sm text-zinc-500">
          La page de détail de l'utilisateur sera implémentée prochainement.
        </p>
      </div>
    </AdminContentLayout>
  )
}

export default AdminUserDetailPage
