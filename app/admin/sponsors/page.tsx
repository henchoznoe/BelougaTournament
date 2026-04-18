/**
 * File: app/admin/sponsors/page.tsx
 * Description: Admin page for managing sponsors.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Handshake } from 'lucide-react'
import type { Metadata } from 'next'
import { AdminContentLayout } from '@/components/features/admin/admin-content-layout'
import { SponsorsList } from '@/components/features/admin/sponsors-list'
import { getAllSponsors } from '@/lib/services/sponsors'

export const metadata: Metadata = {
  title: 'Sponsors',
}

const AdminSponsorsPage = async () => {
  const sponsors = await getAllSponsors()

  return (
    <AdminContentLayout
      segments={[{ label: 'Sponsors' }]}
      icon={Handshake}
      title="Sponsors"
      subtitle="Gérez les sponsors de la plateforme."
    >
      <SponsorsList sponsors={sponsors} />
    </AdminContentLayout>
  )
}

export default AdminSponsorsPage
