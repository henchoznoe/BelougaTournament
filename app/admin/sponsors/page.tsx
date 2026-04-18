/**
 * File: app/admin/sponsors/page.tsx
 * Description: Admin page for managing sponsors.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Handshake } from 'lucide-react'
import type { Metadata } from 'next'
import { SponsorsList } from '@/components/admin/lists/sponsors-list'
import { AdminContentLayout } from '@/components/admin/ui/admin-content-layout'
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
