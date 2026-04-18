/**
 * File: app/(public)/legal/page.tsx
 * Description: Legal notice page (Mentions légales).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalSection } from '@/components/public/legal/legal-section'
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
          description="Informations légales relatives à la plateforme Belouga Tournament. Dernière mise à jour : 6 mars 2026."
        />

        <div className="space-y-6">
          <LegalSection title="1. Éditeur du site">
            <p>
              Conformément aux obligations légales applicables, la plateforme{' '}
              {METADATA.NAME} est éditée par une personne physique :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Nom :</span> Noé Henchoz
              </li>
              <li>
                <span className="text-zinc-300">Statut :</span> Personne
                physique — projet e-sport amateur non commercial
              </li>
              <li>
                <span className="text-zinc-300">Domicile :</span> Canton de
                Fribourg, Suisse
              </li>
              <li>
                <span className="text-zinc-300">
                  Directeur de la publication :
                </span>{' '}
                Noé Henchoz
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
                <span className="text-zinc-300">Site web de l'éditeur :</span>{' '}
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
            <p className="text-sm text-zinc-400">
              En tant que personne physique domiciliée en Suisse, l'éditeur
              n'est pas soumis à immatriculation au Registre du commerce ni à
              l'obligation de détenir un numéro de TVA pour ce projet non
              commercial.
            </p>
          </LegalSection>

          <LegalSection title="2. Hébergement">
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
            <p>
              Le stockage des fichiers (images, logos) est assuré par le service{' '}
              <strong>Vercel Blob</strong>, également opéré par Vercel Inc. Les
              données hébergées peuvent être stockées sur des serveurs situés
              aux États-Unis ou dans d'autres pays. Des garanties contractuelles
              sont en place pour assurer la protection des données conformément
              aux standards suisses et européens (clauses contractuelles types).
            </p>
          </LegalSection>

          <LegalSection title="3. Propriété intellectuelle">
            <p>
              L'ensemble du contenu de la Plateforme (textes, images, logos,
              design, code source) est protégé par le droit d'auteur suisse et
              international. Le code source est publié sous licence MIT.
            </p>
            <p>
              Le nom « Belouga Tournament », le logo et l'identité visuelle
              associée sont la propriété exclusive de l'éditeur. Toute
              reproduction, représentation, modification, publication ou
              adaptation de tout ou partie des éléments du site, quel que soit
              le moyen ou le procédé utilisé, est interdite sans autorisation
              écrite préalable de l'éditeur.
            </p>
            <p>
              Les noms de jeux vidéo, logos et marques mentionnés sur la
              Plateforme (Valorant, League of Legends, Counter-Strike, Rocket
              League, Fortnite, etc.) sont la propriété exclusive de leurs
              éditeurs respectifs et sont utilisés à des fins informatives
              uniquement. Cette Plateforme n'est affiliée à aucun de ces
              éditeurs.
            </p>
          </LegalSection>

          <LegalSection title="4. Données personnelles">
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

          <LegalSection title="5. Cookies">
            <p>
              La Plateforme utilise uniquement des cookies techniques
              strictement nécessaires au fonctionnement de l'authentification
              (cookies de session). Aucun cookie publicitaire ou de profilage
              n'est déposé par la Plateforme.
            </p>
            <p>
              La page de streaming intègre un lecteur Twitch (service tiers
              opéré par Amazon / Twitch Interactive, Inc.) qui est susceptible
              de déposer ses propres cookies sur votre terminal (session Twitch,
              analytics, publicité). Ces cookies tiers sont régis par la{' '}
              <a
                href="https://www.twitch.tv/p/legal/privacy-notice/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 transition-colors hover:text-blue-300"
              >
                politique de confidentialité de Twitch
              </a>
              . La Plateforme n'a aucun contrôle sur ces cookies.
            </p>
            <p>
              Pour plus de détails, consultez notre{' '}
              <Link
                href={ROUTES.PRIVACY}
                className="text-blue-400 transition-colors hover:text-blue-300"
              >
                politique de confidentialité
              </Link>
              .
            </p>
          </LegalSection>

          <LegalSection title="6. Limitation de responsabilité">
            <p>
              La Plateforme est fournie « en l'état » et « selon disponibilité
              », sans garantie d'aucune sorte. L'éditeur ne pourra être tenu
              responsable des dommages directs ou indirects résultant de
              l'utilisation ou de l'impossibilité d'utiliser la Plateforme,
              incluant notamment : les pertes de données, l'indisponibilité du
              service, ou les litiges entre utilisateurs.
            </p>
            <p>
              L'éditeur ne saurait être tenu responsable du contenu des sites
              tiers vers lesquels la Plateforme renvoie par des liens
              hypertextes.
            </p>
          </LegalSection>

          <LegalSection title="7. Liens externes">
            <p>
              La Plateforme peut contenir des liens vers des sites tiers
              (Discord, Twitch, sponsors, etc.). L'éditeur n'exerce aucun
              contrôle sur ces sites et décline toute responsabilité quant à
              leur contenu, leur disponibilité ou leurs pratiques en matière de
              protection des données. La mise en place d'un lien hypertexte vers
              la Plateforme nécessite l'autorisation préalable écrite de
              l'éditeur.
            </p>
          </LegalSection>

          <LegalSection title="8. Droit applicable et juridiction">
            <p>
              Les présentes mentions légales sont soumises au droit suisse,
              notamment à la Loi fédérale contre la concurrence déloyale (LCD),
              à la Loi sur le droit d'auteur (LDA) et à la Loi fédérale sur la
              protection des données (LPD).
            </p>
            <p>
              En cas de litige relatif à l'interprétation ou à l'exécution des
              présentes, et à défaut de résolution amiable, les tribunaux du
              canton de Fribourg (Suisse) seront seuls compétents, sauf
              disposition légale impérative contraire.
            </p>
          </LegalSection>

          <LegalSection title="9. Crédits">
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Développement et design :</span>{' '}
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
                <span className="text-zinc-300">Icônes :</span> Lucide Icons
                (ISC), Font Awesome (CC BY 4.0)
              </li>
              <li>
                <span className="text-zinc-300">Polices :</span> Google Fonts
                (SIL Open Font License)
              </li>
            </ul>
          </LegalSection>
        </div>
      </div>
    </div>
  )
}

export default LegalPage
