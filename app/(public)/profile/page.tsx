/**
 * File: app/(public)/profile/page.tsx
 * Description: User profile page with account info and pseudo editing.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { ProfilePage } from '@/components/public/profile/profile-page'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = {
  title: 'Mon Profil',
  description: 'Gérez votre profil utilisateur.',
}

const ProfilePageContent = () => {
  return (
    <section className="relative px-4 pb-20 pt-32 md:pt-40">
      <PageHeader
        title="Mon Profil"
        description="Consultez vos informations personnelles."
      />
      <ProfilePage />
    </section>
  )
}

export default ProfilePageContent
