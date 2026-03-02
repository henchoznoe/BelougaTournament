/**
 * File: app/(public)/legal/page.tsx
 * Description: Legal notice page (Mentions légales).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalSection } from '@/components/features/legal/legal-section'
import { PageHeader } from '@/components/ui/page-header'
import { AUTHOR, METADATA } from '@/lib/config/constants'
import { ROUTES } from '@/lib/config/routes'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: `Mentions légales de la plateforme ${METADATA.NAME}.`,
}

const LegalPage = () => {
  return (
    <div className="min-h-dvh pb-20 pt-32">
      <div className="container mx-auto max-w-4xl px-4">
        <PageHeader
          title="MENTIONS LÉGALES"
          description="Informations légales relatives à la plateforme Belouga Tournament. Dernière mise à jour : 1er mars 2026."
        />

        <div className="space-y-6">
          <LegalSection title="Éditeur du site">
            <p>La plateforme {METADATA.NAME} est éditée par :</p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Nom :</span> Noé Henchoz
              </li>
              <li>
                <span className="text-zinc-300">Statut :</span> Personne
                physique — projet associatif e-sport
              </li>
              <li>
                <span className="text-zinc-300">Localisation :</span> Suisse
              </li>
              <li>
                <span className="text-zinc-300">Contact :</span>{' '}
                <Link
                  href={`mailto:${AUTHOR.EMAIL}`}
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  {AUTHOR.EMAIL}
                </Link>
              </li>
              <li>
                <span className="text-zinc-300">Site web :</span>{' '}
                <a
                  href={AUTHOR.URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  {AUTHOR.URL}
                </a>
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="Hébergement">
            <p>La Plateforme est hébergée par :</p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Nom :</span> Vercel Inc.
              </li>
              <li>
                <span className="text-zinc-300">Adresse :</span> 440 N Barranca
                Ave #4133, Covina, CA 91723, États-Unis
              </li>
              <li>
                <span className="text-zinc-300">Site web :</span>{' '}
                <a
                  href="https://vercel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  vercel.com
                </a>
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="Propriété intellectuelle">
            <p>
              L'ensemble du contenu de la Plateforme (textes, images, logos,
              design, code source) est protégé par le droit d'auteur. Le code
              source est publié sous licence MIT.
            </p>
            <p>
              Le nom « Belouga Tournament », le logo et l'identité visuelle
              associée sont la propriété de l'éditeur. Toute reproduction non
              autorisée est interdite.
            </p>
            <p>
              Les noms de jeux vidéo, logos et marques mentionnés sur la
              Plateforme (Valorant, League of Legends, Counter-Strike, Rocket
              League, Fortnite, etc.) sont la propriété de leurs éditeurs
              respectifs et sont utilisés à des fins informatives uniquement.
            </p>
          </LegalSection>

          <LegalSection title="Données personnelles">
            <p>
              Pour toute information sur la collecte et le traitement de vos
              données personnelles, veuillez consulter notre{' '}
              <Link
                href={ROUTES.PRIVACY}
                className="text-blue-400 transition-colors hover:text-blue-300"
              >
                politique de confidentialité
              </Link>
              .
            </p>
          </LegalSection>

          <LegalSection title="Cookies">
            <p>
              La Plateforme utilise uniquement des cookies techniques
              nécessaires au fonctionnement de l'authentification. Aucun cookie
              publicitaire ou de tracking n'est déposé. Pour plus de détails,
              consultez notre{' '}
              <Link
                href={ROUTES.PRIVACY}
                className="text-blue-400 transition-colors hover:text-blue-300"
              >
                politique de confidentialité
              </Link>
              .
            </p>
          </LegalSection>

          <LegalSection title="Limitation de responsabilité">
            <p>
              L'éditeur s'efforce de fournir des informations exactes et à jour
              sur la Plateforme. Toutefois, il ne peut garantir l'exactitude, la
              complétude ou l'actualité des informations diffusées.
            </p>
            <p>
              La Plateforme est fournie « en l'état ». L'éditeur ne pourra être
              tenu responsable des dommages directs ou indirects résultant de
              l'utilisation de la Plateforme, incluant mais sans s'y limiter :
              les pertes de données, l'indisponibilité du service, ou les
              litiges entre utilisateurs.
            </p>
          </LegalSection>

          <LegalSection title="Liens externes">
            <p>
              La Plateforme peut contenir des liens vers des sites tiers
              (Discord, Twitch, sponsors, etc.). L'éditeur n'exerce aucun
              contrôle sur ces sites et décline toute responsabilité quant à
              leur contenu ou leurs pratiques en matière de protection des
              données.
            </p>
          </LegalSection>

          <LegalSection title="Droit applicable">
            <p>
              Les présentes mentions légales sont soumises au droit suisse. En
              cas de litige, les tribunaux du canton de Vaud seront seuls
              compétents, sauf disposition légale contraire.
            </p>
          </LegalSection>

          <LegalSection title="Crédits">
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Développement :</span>{' '}
                <a
                  href={AUTHOR.URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  {AUTHOR.NAME}
                </a>
              </li>
              <li>
                <span className="text-zinc-300">Framework :</span> Next.js,
                React, TailwindCSS
              </li>
              <li>
                <span className="text-zinc-300">Hébergement :</span> Vercel
              </li>
              <li>
                <span className="text-zinc-300">Authentification :</span>{' '}
                BetterAuth + Discord OAuth
              </li>
              <li>
                <span className="text-zinc-300">Icônes :</span> Lucide Icons,
                Font Awesome
              </li>
            </ul>
          </LegalSection>
        </div>
      </div>
    </div>
  )
}

export default LegalPage
