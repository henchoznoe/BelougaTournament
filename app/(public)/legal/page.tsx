/**
 * File: app/(public)/legal/page.tsx
 * Description: Legal mentions page.
 * Author: Noé Henchoz
 * Date: 2025-12-08
 * License: MIT
 */

import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/layout/legal-page-layout'
import { fr } from '@/lib/i18n/dictionaries/fr'

export const metadata: Metadata = {
  title: fr.pages.legal.metaTitle,
  description: fr.pages.legal.metaDescription,
}

export default function LegalPage() {
  return (
    <LegalPageLayout
      title={fr.pages.legal.title}
      description={fr.pages.legal.description}
    >
      <h2>{fr.pages.legal.sections.editor.title}</h2>
      <p>{fr.pages.legal.sections.editor.content}</p>

      <h2>{fr.pages.legal.sections.hosting.title}</h2>
      <p>
        {fr.pages.legal.sections.hosting.contentPrefix}
        <br />
        {fr.pages.legal.sections.hosting.address.map(line => (
          <span key={line}>
            {line}
            <br />
          </span>
        ))}
      </p>

      <h2>{fr.pages.legal.sections.intellectualProperty.title}</h2>
      <p>{fr.pages.legal.sections.intellectualProperty.content}</p>

      <h2>{fr.pages.legal.sections.content.title}</h2>
      <p>{fr.pages.legal.sections.content.content}</p>
    </LegalPageLayout>
  )
}
