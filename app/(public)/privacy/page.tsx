/**
 * File: app/(public)/privacy/page.tsx
 * Description: Privacy policy page.
 * Author: Noé Henchoz
 * Date: 2025-12-08
 * License: MIT
 */

import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/layout/legal-layout'
import { fr } from '@/lib/i18n/dictionaries/fr'

export const metadata: Metadata = {
  title: fr.pages.privacy.metaTitle,
  description: fr.pages.privacy.metaDescription,
}

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title={fr.pages.privacy.title}
      description={fr.pages.privacy.description}
    >
      <h2>{fr.pages.privacy.sections.collection.title}</h2>
      <p>{fr.pages.privacy.sections.collection.intro}</p>
      <ul>
        {fr.pages.privacy.sections.collection.list.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2>{fr.pages.privacy.sections.usage.title}</h2>
      <p>{fr.pages.privacy.sections.usage.intro}</p>
      <ul>
        {fr.pages.privacy.sections.usage.list.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>{fr.pages.privacy.sections.usage.outro}</p>

      <h2>{fr.pages.privacy.sections.rights.title}</h2>
      <p>{fr.pages.privacy.sections.rights.content}</p>

      <h2>{fr.pages.privacy.sections.cookies.title}</h2>
      <p>{fr.pages.privacy.sections.cookies.content}</p>
    </LegalPageLayout>
  )
}
