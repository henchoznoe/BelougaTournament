/**
 * File: app/admin/sponsors/[id]/page.tsx
 * Description: Admin page for viewing sponsor details (placeholder).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Handshake } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminContentLayout } from '@/components/admin/ui/admin-content-layout'
import { ROUTES } from '@/lib/config/routes'
import { getSponsorById } from '@/lib/services/sponsors'

interface AdminSponsorDetailPageProps {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params,
}: AdminSponsorDetailPageProps): Promise<Metadata> => {
  const { id } = await params
  const sponsor = await getSponsorById(id)
  return {
    title: sponsor ? sponsor.name : 'Sponsor introuvable',
  }
}

const AdminSponsorDetailPage = async ({
  params,
}: AdminSponsorDetailPageProps) => {
  const { id } = await params
  const sponsor = await getSponsorById(id)

  if (!sponsor) {
    notFound()
  }

  return (
    <AdminContentLayout
      segments={[
        { label: 'Sponsors', href: ROUTES.ADMIN_SPONSORS },
        { label: sponsor.name },
      ]}
      icon={Handshake}
      title={sponsor.name}
    >
      <div className="rounded-2xl border border-white/5 bg-white/2 p-8 text-center backdrop-blur-sm">
        <p className="text-sm text-zinc-500">
          La page de détail du sponsor sera implémentée prochainement.
        </p>
      </div>
    </AdminContentLayout>
  )
}

export default AdminSponsorDetailPage
