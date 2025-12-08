/**
 * File: app/(public)/privacy/page.tsx
 * Description: Privacy policy page.
 * Author: Noé Henchoz
 * Date: 2025-12-08
 * License: MIT
 */

import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/layout/legal-page-layout'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité',
  description: 'Informations sur la collecte et l’utilisation de vos données.',
}

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Politique de Confidentialité"
      description="Nous accordons une importance primordiale à la confidentialité et à la sécurité de vos données personnelles."
    >
      <h2>Collecte des Données</h2>
      <p>
        Dans le cadre de l'utilisation de la plateforme, nous sommes amenés à
        collecter certaines données personnelles nécessaires au bon
        fonctionnement du service :
      </p>
      <ul>
        <li>
          Informations de compte : Pseudo, adresse email, identifiants (Discord,
          etc.).
        </li>
        <li>Données de connexion : Adresse IP, type de navigateur.</li>
        <li>Données de participation : Historique des tournois, résultats.</li>
      </ul>

      <h2>Utilisation des Données</h2>
      <p>Vos données sont utilisées exclusivement pour :</p>
      <ul>
        <li>Gérer votre compte et vérifier votre identité.</li>
        <li>Organiser les tournois et communiquer avec vous.</li>
        <li>
          Améliorer la sécurité et l'expérience utilisateur de la plateforme.
        </li>
        <li>Verser les récompenses aux gagnants.</li>
      </ul>
      <p>Nous ne vendons ni ne louons vos données personnelles à des tiers.</p>

      <h2>Vos Droits</h2>
      <p>
        Conformément au RGPD, vous disposez d'un droit d'accès, de
        rectification, d'effacement et de portabilité de vos données. Vous
        pouvez exercer ces droits en nous contactant via le support.
      </p>

      <h2>Cookies</h2>
      <p>
        Le site utilise des cookies essentiels au fonctionnement (session) et,
        avec votre consentement, des cookies d'analyse pour mesurer l'audience
        et améliorer nos services.
      </p>
    </LegalPageLayout>
  )
}
