/**
 * File: app/(public)/terms/page.tsx
 * Description: Terms of service page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/layout/legal-layout'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for Belouga Tournament.',
}

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="Terms of service for Belouga Tournament."
    >
      <h2>Terms of Service</h2>
      <p>Terms of service for Belouga Tournament.</p>
    </LegalPageLayout>
  )
}
