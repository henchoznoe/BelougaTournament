/**
 * File: app/(public)/rules/page.tsx
 * Description: Tournament rules page.
 * Author: Noé Henchoz
 * Date: 2025-12-08
 * License: MIT
 */

import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/layout/legal-layout'
import { fr } from '@/lib/i18n/dictionaries/fr'

export const metadata: Metadata = {
  title: fr.pages.rules.metaTitle,
  description: fr.pages.rules.metaDescription,
}

export default function RulesPage() {
  return (
    <LegalPageLayout
      title={fr.pages.rules.title}
      description={fr.pages.rules.description}
    >
      <h2>{fr.pages.rules.sections.participation.title}</h2>
      <p>{fr.pages.rules.sections.participation.intro}</p>
      <ul>
        {fr.pages.rules.sections.participation.list.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2>{fr.pages.rules.sections.matches.title}</h2>
      <p>{fr.pages.rules.sections.matches.content}</p>

      <h2>{fr.pages.rules.sections.behavior.title}</h2>
      <p>{fr.pages.rules.sections.behavior.content}</p>

      <h2>{fr.pages.rules.sections.infractions.title}</h2>
      <p>{fr.pages.rules.sections.infractions.content}</p>

      <h2>{fr.pages.rules.sections.rewards.title}</h2>
      <p>{fr.pages.rules.sections.rewards.content}</p>
    </LegalPageLayout>
  )
}
