/**
 * File: app/(public)/legal/page.tsx
 * Description: Legal mentions page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/layout/legal-layout'

export const metadata: Metadata = {
  title: 'Legal Mentions',
  description: 'Legal mentions for Belouga Tournament.',
}

export default function LegalPage() {
  return (
    <LegalPageLayout
      title="Legal Mentions"
      description="Legal mentions for Belouga Tournament."
    >
      <h2>Legal Mentions</h2>
      <p>Legal mentions for Belouga Tournament.</p>
    </LegalPageLayout>
  )
}
