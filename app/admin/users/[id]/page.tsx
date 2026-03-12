/**
 * File: app/admin/users/[id]/page.tsx
 * Description: Admin page for viewing and managing a single user (detail view).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ArrowLeft, Users } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { UserDetail } from '@/components/features/admin/user-detail'
import { ROUTES } from '@/lib/config/routes'
import { getSession } from '@/lib/services/auth'
import { getTournamentOptions, getUserById } from '@/lib/services/users'
import { isOwner } from '@/lib/utils/owner'
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
    title: user ? user.name : 'Utilisateur introuvable',
  }
}

const AdminUserDetailPage = async ({ params }: AdminUserDetailPageProps) => {
  const { id } = await params
  const session = await getSession()

  if (!session?.user) {
    redirect(ROUTES.LOGIN)
  }

  const [user, tournaments] = await Promise.all([
    getUserById(id),
    getTournamentOptions(),
  ])

  if (!user) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page heading */}
      <div className="space-y-1">
        <Link
          href={ROUTES.ADMIN_USERS}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <ArrowLeft className="size-4" />
          Retour aux utilisateurs
        </Link>
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
          <Users className="size-6 text-blue-400" />
          {user.name}
        </h1>
      </div>

      <UserDetail
        user={user}
        tournaments={tournaments}
        viewerRole={session.user.role as Role}
        viewerIsOwner={isOwner(session.user.email)}
      />
    </div>
  )
}

export default AdminUserDetailPage
