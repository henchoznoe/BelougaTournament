/**
 * File: app/admin/sponsors/[id]/edit/page.tsx
 * Description: Admin page for editing an existing sponsor.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Pencil } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminBreadcrumb } from '@/components/features/admin/admin-breadcrumb'
import { SponsorForm } from '@/components/features/admin/sponsor-form'
import AdminGuard from '@/components/features/auth/admin-guard'
import { ROUTES } from '@/lib/config/routes'
import { getSponsorById } from '@/lib/services/sponsors'

interface AdminEditSponsorPageProps {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params,
}: AdminEditSponsorPageProps): Promise<Metadata> => {
  const { id } = await params
  const sponsor = await getSponsorById(id)
  return {
    title: sponsor ? `Modifier ${sponsor.name}` : 'Sponsor introuvable',
  }
}

const AdminEditSponsorPage = async ({ params }: AdminEditSponsorPageProps) => {
  const { id } = await params
  const sponsor = await getSponsorById(id)

  if (!sponsor) {
    notFound()
  }

  return (
    <AdminGuard>
      <div className="mx-auto max-w-5xl space-y-6">
        <AdminBreadcrumb
          segments={[
            { label: 'Sponsors', href: ROUTES.ADMIN_SPONSORS },
            { label: sponsor.name, href: ROUTES.ADMIN_SPONSORS },
            { label: 'Modifier' },
          ]}
        />

        {/* Page heading */}
        <div className="space-y-1">
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
            <Pencil className="size-6 text-blue-400" />
            Modifier {sponsor.name}
          </h1>
          <p className="text-sm text-zinc-400">
            Modifiez les informations du sponsor.
          </p>
        </div>

        <SponsorForm sponsor={sponsor} />
      </div>
    </AdminGuard>
  )
}

export default AdminEditSponsorPage
