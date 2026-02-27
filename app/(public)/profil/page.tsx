/**
 * File: app/(public)/profil/page.tsx
 * Description: User profile page with account info and pseudo editing.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ProfilePage } from '@/components/features/profile/profile-page'
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
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-2xl space-y-6">
            {/* Skeleton card 1 */}
            <div className="h-64 animate-pulse rounded-3xl border border-white/5 bg-white/2" />
            {/* Skeleton card 2 */}
            <div className="h-48 animate-pulse rounded-3xl border border-white/5 bg-white/2" />
            {/* Skeleton card 3 */}
            <div className="h-40 animate-pulse rounded-3xl border border-white/5 bg-white/2" />
          </div>
        }
      >
        <ProfilePage />
      </Suspense>
    </section>
  )
}

export default ProfilePageContent
