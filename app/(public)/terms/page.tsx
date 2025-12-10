/**
 * File: app/(public)/terms/page.tsx
 * Description: Terms of service page.
 * Author: Noé Henchoz
 * Date: 2025-12-08
 * License: MIT
 */

import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/layout/legal-layout'
import { fr } from '@/lib/i18n/dictionaries/fr'

export const metadata: Metadata = {
  title: fr.pages.terms.metaTitle,
  description: fr.pages.terms.metaDescription,
}

export default function TermsPage() {
  return (
    <LegalPageLayout
      title={fr.pages.terms.title}
      description={fr.pages.terms.description}
    >
      <h2>{fr.pages.terms.sections.object.title}</h2>
      <p>{fr.pages.terms.sections.object.content}</p>

      <h2>{fr.pages.terms.sections.access.title}</h2>
      <p>{fr.pages.terms.sections.access.content}</p>

      <h2>{fr.pages.terms.sections.account.title}</h2>
      <p>{fr.pages.terms.sections.account.content}</p>

      <h2>{fr.pages.terms.sections.liability.title}</h2>
      <p>{fr.pages.terms.sections.liability.content}</p>

      <h2>{fr.pages.terms.sections.intellectualProperty.title}</h2>
      <p>{fr.pages.terms.sections.intellectualProperty.content}</p>

      <h2>{fr.pages.terms.sections.law.title}</h2>
      <p>{fr.pages.terms.sections.law.content}</p>
    </LegalPageLayout>
  )
}
