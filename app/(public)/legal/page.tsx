/**
 * File: app/(public)/legal/page.tsx
 * Description: Legal mentions page.
 * Author: Noé Henchoz
 * Date: 2025-12-08
 * License: MIT
 */

import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/layout/legal-page-layout'

export const metadata: Metadata = {
  title: 'Mentions Légales',
  description: 'Mentions légales et informations sur l’éditeur.',
}

export default function LegalPage() {
  return (
    <LegalPageLayout
      title="Mentions Légales"
      description="Informations légales concernant l'éditeur et l'hébergement du site."
    >
      <h2>Éditeur du Site</h2>
      <p>
        Le site Belouga Tournament est édité à titre personnel. Pour toute
        question ou réclamation, vous pouvez nous contacter via le formulaire de
        contact disponible sur la plateforme.
      </p>

      <h2>Hébergement</h2>
      <p>
        Ce site est hébergé par Vercel Inc., dont le siège social est situé au :
        <br />
        Vercel Inc.
        <br />
        340 S Lemon Ave #4133
        <br />
        Walnut, CA 91789
        <br />
        États-Unis
      </p>

      <h2>Propriété Intellectuelle</h2>
      <p>
        L'ensemble de ce site relève de la législation française et
        internationale sur le droit d'auteur et la propriété intellectuelle.
        Tous les droits de reproduction sont réservés, y compris pour les
        documents téléchargeables et les représentations iconographiques et
        photographiques.
      </p>

      <h2>Contenu</h2>
      <p>
        La reproduction de tout ou partie de ce site sur un support électronique
        quel qu'il soit est formellement interdite sauf autorisation expresse du
        directeur de la publication.
      </p>
    </LegalPageLayout>
  )
}
