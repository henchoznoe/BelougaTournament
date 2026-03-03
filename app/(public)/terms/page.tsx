/**
 * File: app/(public)/terms/page.tsx
 * Description: Terms and conditions page (CGU).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import { LegalSection } from '@/components/features/legal/legal-section'
import { PageHeader } from '@/components/ui/page-header'
import { METADATA } from '@/lib/config/constants'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description: `Conditions générales d'utilisation de la plateforme ${METADATA.NAME}.`,
}

const TermsPage = () => {
  return (
    <div className="min-h-dvh pb-20 pt-32">
      <div className="container mx-auto max-w-4xl px-4">
        <PageHeader
          title="CONDITIONS GÉNÉRALES"
          description="Conditions générales d'utilisation de la plateforme Belouga Tournament. Dernière mise à jour : 1er mars 2026."
        />

        <div className="space-y-6">
          <LegalSection title="1. Objet">
            <p>
              Les présentes Conditions Générales d'Utilisation (ci-après « CGU
              ») régissent l'accès et l'utilisation de la plateforme{' '}
              {METADATA.NAME} (ci-après « la Plateforme »), accessible à
              l'adresse belougatournament.ch.
            </p>
            <p>
              La Plateforme permet l'organisation, la gestion et la
              participation à des tournois e-sport amateurs. En accédant à la
              Plateforme, vous acceptez sans réserve les présentes CGU.
            </p>
          </LegalSection>

          <LegalSection title="2. Inscription et compte utilisateur">
            <p>
              L'inscription sur la Plateforme s'effectue exclusivement via
              l'authentification Discord (OAuth 2.0). En vous inscrivant, vous
              garantissez que :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                Vous êtes âgé(e) d'au moins 16 ans ou disposez de l'autorisation
                d'un représentant légal
              </li>
              <li>
                Les informations fournies via votre compte Discord sont exactes
              </li>
              <li>
                Vous êtes responsable de la sécurité de votre compte Discord
              </li>
            </ul>
            <p>
              La Plateforme se réserve le droit de suspendre ou supprimer tout
              compte ne respectant pas les présentes CGU.
            </p>
          </LegalSection>

          <LegalSection title="3. Participation aux tournois">
            <p>
              La participation aux tournois est soumise aux conditions suivantes
              :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                L'inscription à un tournoi vaut acceptation du règlement
                spécifique de ce tournoi
              </li>
              <li>
                Les joueurs doivent respecter les règles du jeu concerné et le
                fair-play
              </li>
              <li>
                Toute forme de triche, d'exploit ou de comportement toxique est
                strictement interdite
              </li>
              <li>
                Les décisions des administrateurs et arbitres sont définitives
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="4. Sanctions et bannissement">
            <p>
              En cas de non-respect des CGU ou du règlement d'un tournoi, les
              administrateurs peuvent appliquer des sanctions incluant :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>Un avertissement</li>
              <li>La disqualification d'un tournoi en cours</li>
              <li>Un bannissement temporaire de la Plateforme</li>
              <li>
                Un bannissement permanent en cas de récidive ou de faute grave
              </li>
            </ul>
            <p>
              Les sanctions sont appliquées à la discrétion des administrateurs.
              Un motif est systématiquement communiqué.
            </p>
          </LegalSection>

          <LegalSection title="5. Propriété intellectuelle">
            <p>
              L'ensemble des éléments de la Plateforme (design, code, textes,
              logos) est la propriété de {METADATA.NAME} ou de ses partenaires.
              Toute reproduction, distribution ou utilisation non autorisée est
              interdite.
            </p>
            <p>
              Les noms de jeux, logos et marques associés sont la propriété de
              leurs détenteurs respectifs et sont utilisés à titre informatif
              uniquement.
            </p>
          </LegalSection>

          <LegalSection title="6. Limitation de responsabilité">
            <p>
              La Plateforme est fournie « en l'état ». {METADATA.NAME} ne
              garantit pas un fonctionnement ininterrompu ou exempt d'erreurs.
              En aucun cas {METADATA.NAME} ne pourra être tenu responsable de :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>Pertes de données liées à l'utilisation de la Plateforme</li>
              <li>Interruptions de service indépendantes de notre volonté</li>
              <li>Litiges entre participants lors des tournois</li>
              <li>Problèmes techniques liés aux jeux ou services tiers</li>
            </ul>
          </LegalSection>

          <LegalSection title="7. Modification des CGU">
            <p>
              {METADATA.NAME} se réserve le droit de modifier les présentes CGU
              à tout moment. Les utilisateurs seront informés de toute
              modification substantielle. L'utilisation continue de la
              Plateforme après modification vaut acceptation des nouvelles CGU.
            </p>
          </LegalSection>

          <LegalSection title="8. Contact">
            <p>
              Pour toute question relative aux présentes CGU, vous pouvez nous
              contacter via notre serveur Discord ou par le formulaire de
              contact disponible sur la Plateforme.
            </p>
          </LegalSection>
        </div>
      </div>
    </div>
  )
}

export default TermsPage
