/**
 * File: app/(public)/privacy/page.tsx
 * Description: Privacy policy page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/layout/legal-layout'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for Belouga Tournament.',
}

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="Privacy policy for Belouga Tournament."
    >
      <h2>Privacy Policy</h2>
      <p>Privacy policy for Belouga Tournament.</p>
    </LegalPageLayout>
  )
}
