/**
 * File: app/(public)/privacy/page.tsx
 * Description: Privacy policy page (Politique de confidentialité).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { LegalSection } from '@/components/features/legal/legal-section'
import { PageHeader } from '@/components/ui/page-header'
import { METADATA } from '@/lib/config/constants'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: `Politique de confidentialité et protection des données de ${METADATA.NAME}.`,
}

const PrivacyPage = () => {
  return (
    <div className="min-h-dvh pb-20 pt-32">
      <div className="container mx-auto max-w-4xl px-4">
        <PageHeader
          title="CONFIDENTIALITÉ"
          description="Politique de confidentialité et de protection des données personnelles. Dernière mise à jour : 1er mars 2026."
        />

        <div className="space-y-6">
          <LegalSection title="1. Responsable du traitement">
            <p>
              Le responsable du traitement des données personnelles collectées
              via la plateforme {METADATA.NAME} est :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Nom :</span> Noé Henchoz
              </li>
              <li>
                <span className="text-zinc-300">Contact :</span> Via Discord ou
                formulaire de contact
              </li>
              <li>
                <span className="text-zinc-300">Localisation :</span> Suisse
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="2. Données collectées">
            <p>
              Lors de votre inscription et utilisation de la Plateforme, nous
              collectons les données suivantes :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Données Discord :</span>{' '}
                Identifiant Discord, nom d'utilisateur, adresse e-mail, avatar
              </li>
              <li>
                <span className="text-zinc-300">Données de session :</span>{' '}
                Adresse IP, user agent, dates de connexion
              </li>
              <li>
                <span className="text-zinc-300">Données de tournoi :</span>{' '}
                Inscriptions, compositions d'équipe, champs personnalisés
                remplis lors de l'inscription
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="3. Finalités du traitement">
            <p>
              Vos données personnelles sont traitées pour les finalités
              suivantes :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>Gestion de votre compte utilisateur et authentification</li>
              <li>Organisation et administration des tournois</li>
              <li>
                Communication relative aux tournois (inscriptions, résultats)
              </li>
              <li>Modération de la communauté et application des sanctions</li>
              <li>
                Amélioration de la Plateforme et statistiques d'utilisation
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="4. Base légale">
            <p>Le traitement de vos données repose sur :</p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Consentement :</span> Lors de
                votre inscription via Discord OAuth
              </li>
              <li>
                <span className="text-zinc-300">Intérêt légitime :</span> Pour
                la sécurité et la modération de la Plateforme
              </li>
              <li>
                <span className="text-zinc-300">Exécution contractuelle :</span>{' '}
                Pour la gestion de votre participation aux tournois
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="5. Partage des données">
            <p>
              Vos données personnelles ne sont jamais vendues à des tiers. Elles
              peuvent être partagées avec :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Vercel :</span> Hébergement de
                la Plateforme (États-Unis)
              </li>
              <li>
                <span className="text-zinc-300">Discord :</span>{' '}
                Authentification OAuth (États-Unis)
              </li>
            </ul>
            <p>
              Ces prestataires sont soumis à des clauses contractuelles
              garantissant la protection de vos données conformément aux
              standards suisses et européens.
            </p>
          </LegalSection>

          <LegalSection title="6. Durée de conservation">
            <p>Vos données sont conservées selon les durées suivantes :</p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Compte utilisateur :</span> Tant
                que le compte est actif, puis 1 an après la dernière connexion
              </li>
              <li>
                <span className="text-zinc-300">Données de tournoi :</span> 2
                ans après la fin du tournoi
              </li>
              <li>
                <span className="text-zinc-300">Logs de session :</span> 6 mois
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="7. Vos droits">
            <p>
              Conformément à la Loi fédérale sur la protection des données (LPD)
              et au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Droit d'accès :</span> Obtenir
                une copie de vos données personnelles
              </li>
              <li>
                <span className="text-zinc-300">Droit de rectification :</span>{' '}
                Corriger des données inexactes
              </li>
              <li>
                <span className="text-zinc-300">Droit à l'effacement :</span>{' '}
                Demander la suppression de vos données
              </li>
              <li>
                <span className="text-zinc-300">Droit à la portabilité :</span>{' '}
                Recevoir vos données dans un format structuré
              </li>
              <li>
                <span className="text-zinc-300">Droit d'opposition :</span> Vous
                opposer au traitement de vos données
              </li>
            </ul>
            <p>
              Pour exercer vos droits, contactez-nous via Discord ou le
              formulaire de contact.
            </p>
          </LegalSection>

          <LegalSection title="8. Cookies et analytics">
            <p>La Plateforme utilise :</p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Cookies de session :</span>{' '}
                Nécessaires au fonctionnement de l'authentification
              </li>
              <li>
                <span className="text-zinc-300">Vercel Analytics :</span>{' '}
                Collecte anonyme de données de performance (sans cookies)
              </li>
              <li>
                <span className="text-zinc-300">Vercel Speed Insights :</span>{' '}
                Mesure de performance anonyme
              </li>
            </ul>
            <p>Aucun cookie publicitaire ou de tracking tiers n'est utilisé.</p>
          </LegalSection>

          <LegalSection title="9. Sécurité">
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles
              appropriées pour protéger vos données, notamment :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>Chiffrement des communications (HTTPS/TLS)</li>
              <li>Authentification sécurisée via OAuth 2.0</li>
              <li>Accès restreint aux données par rôle (ADMIN, SUPERADMIN)</li>
              <li>Monitoring des erreurs et alertes de sécurité</li>
            </ul>
          </LegalSection>

          <LegalSection title="10. Modifications">
            <p>
              Cette politique de confidentialité peut être modifiée à tout
              moment. En cas de modification substantielle, les utilisateurs
              seront informés via la Plateforme. La date de dernière mise à jour
              est indiquée en haut de cette page.
            </p>
          </LegalSection>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPage
