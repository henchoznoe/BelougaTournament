/**
 * File: app/(public)/rules/page.tsx
 * Description: Tournament rules page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/layout/legal-layout'

export const metadata: Metadata = {
  title: 'Rules',
  description: 'Rules for Belouga Tournament.',
}

export default function RulesPage() {
  return (
    <LegalPageLayout title="Rules" description="Rules for Belouga Tournament.">
      <h2>Rules</h2>
      <p>Rules for Belouga Tournament.</p>
    </LegalPageLayout>
  )
}
