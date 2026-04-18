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
import { SponsorForm } from '@/components/admin/forms/sponsor-form'
import { AdminContentLayout } from '@/components/admin/ui/admin-content-layout'
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
    <AdminContentLayout
      segments={[
        { label: 'Sponsors', href: ROUTES.ADMIN_SPONSORS },
        { label: sponsor.name, href: ROUTES.ADMIN_SPONSORS },
        { label: 'Modifier' },
      ]}
      icon={Pencil}
      title={`Modifier ${sponsor.name}`}
      subtitle="Modifiez les informations du sponsor."
    >
      <SponsorForm sponsor={sponsor} />
    </AdminContentLayout>
  )
}

export default AdminEditSponsorPage
