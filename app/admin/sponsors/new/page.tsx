/**
 * File: app/admin/sponsors/new/page.tsx
 * Description: Admin page for creating a new sponsor.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import { AdminContentLayout } from '@/components/features/admin/admin-content-layout'
import { SponsorForm } from '@/components/features/admin/sponsor-form'
import { ROUTES } from '@/lib/config/routes'

export const metadata: Metadata = {
  title: 'Nouveau sponsor',
}

const AdminNewSponsorPage = async () => {
  return (
    <AdminContentLayout
      segments={[
        { label: 'Sponsors', href: ROUTES.ADMIN_SPONSORS },
        { label: 'Nouveau sponsor' },
      ]}
      icon={Plus}
      title="Nouveau sponsor"
      subtitle="Créez un nouveau sponsor sur la plateforme."
    >
      <SponsorForm />
    </AdminContentLayout>
  )
}

export default AdminNewSponsorPage
