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
import { AUTHOR, METADATA, OWNER } from '@/lib/config/constants'
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
          description="Informations légales relatives à la plateforme Belouga Tournament. Dernière mise à jour : 25 avril 2026."
        />

        <div className="space-y-6">
          <LegalSection title="1. Éditeur du site">
            <p>
              Conformément aux obligations légales applicables, la plateforme{' '}
              {METADATA.NAME} est éditée par une personne physique :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Nom :</span> {OWNER.NAME}
              </li>
              <li>
                <span className="text-zinc-300">Statut :</span> Personne
                physique — projet e-sport amateur
              </li>
              <li>
                <span className="text-zinc-300">Domicile :</span> Canton de
                Fribourg, Suisse
              </li>
              <li>
                <span className="text-zinc-300">
                  Directeur de la publication :
                </span>{' '}
                {OWNER.NAME}
              </li>
              <li>
                <span className="text-zinc-300">Contact :</span>{' '}
                <Link
                  href={`mailto:${OWNER.EMAIL}`}
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  {OWNER.EMAIL}
                </Link>
              </li>
            </ul>
            <p className="text-sm text-zinc-400">
              En tant que personne physique domiciliée en Suisse, l'éditeur
              n'est pas soumis à immatriculation au Registre du commerce ni à
              l'obligation de détenir un numéro de TVA pour ce projet.
            </p>
          </LegalSection>

          <LegalSection title="2. Hébergement et prestataires techniques">
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

            <p className="mt-2">La base de données est hébergée par :</p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Nom :</span> Supabase Inc.
              </li>
              <li>
                <span className="text-zinc-300">Région :</span> Europe centrale
                — Zurich (eu-central-2)
              </li>
              <li>
                <span className="text-zinc-300">Site web :</span>{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  supabase.com
                </a>
              </li>
            </ul>
            <p>
              Supabase héberge la base de données PostgreSQL contenant les
              données utilisateurs, les données de tournoi, les sessions et les
              références de paiement. Les données sont stockées sur des serveurs
              situés en Suisse (région Zurich).
            </p>

            <p className="mt-2">Les paiements sont traités par :</p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Nom :</span> Stripe, Inc.
              </li>
              <li>
                <span className="text-zinc-300">Adresse :</span> 354 Oyster
                Point Blvd, South San Francisco, CA 94080, États-Unis
              </li>
              <li>
                <span className="text-zinc-300">Site web :</span>{' '}
                <a
                  href="https://stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  stripe.com
                </a>
              </li>
            </ul>
            <p>
              Stripe agit en tant que prestataire de paiement tiers. Aucune
              donnée bancaire ou de carte de crédit n'est stockée sur les
              serveurs de la Plateforme. Le traitement des paiements est soumis
              aux{' '}
              <a
                href="https://stripe.com/legal/ssa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 transition-colors hover:text-blue-300"
              >
                Conditions d'utilisation de Stripe
              </a>
              .
            </p>

            <p className="mt-2">
              L'analyse d'audience, la surveillance des erreurs et
              l'enregistrement de session sont assurés par :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Nom :</span> PostHog Inc.
              </li>
              <li>
                <span className="text-zinc-300">Instance :</span> Europe
                (eu.i.posthog.com)
              </li>
              <li>
                <span className="text-zinc-300">Site web :</span>{' '}
                <a
                  href="https://posthog.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  posthog.com
                </a>
              </li>
            </ul>
            <p>
              PostHog est utilisé pour l'analyse d'audience, le suivi des
              événements d'utilisation, la capture automatique des erreurs
              JavaScript et l'enregistrement de session (session replay) à des
              fins de débogage et d'amélioration de l'expérience utilisateur.
              Les données transitent via un proxy first-party sur notre domaine.
            </p>

            <p className="mt-2">
              Les e-mails transactionnels (formulaire de contact) sont envoyés
              via :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Nom :</span> Resend, Inc.
              </li>
              <li>
                <span className="text-zinc-300">Site web :</span>{' '}
                <a
                  href="https://resend.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  resend.com
                </a>
              </li>
            </ul>

            <p className="mt-2">
              Les brackets et résultats de tournois peuvent être affichés via
              des widgets iframe fournis par :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Nom :</span> Toornament
                (Webedia)
              </li>
              <li>
                <span className="text-zinc-300">Site web :</span>{' '}
                <a
                  href="https://www.toornament.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  toornament.com
                </a>
              </li>
            </ul>
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
            <p>La Plateforme utilise les cookies suivants :</p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Cookies de session :</span>{' '}
                Strictement nécessaires au fonctionnement de l'authentification.
                Ces cookies ne peuvent pas être désactivés sans empêcher
                l'utilisation de la Plateforme
              </li>
              <li>
                <span className="text-zinc-300">
                  Cookies d'analyse (PostHog) :
                </span>{' '}
                Utilisés pour l'analyse d'audience, le suivi des événements et
                l'enregistrement de session à des fins d'amélioration de la
                Plateforme. Déposés sous intérêt légitime, sans finalité
                publicitaire
              </li>
            </ul>
            <p>
              La page de streaming intègre un lecteur Twitch et certaines pages
              de tournois intègrent un widget Toornament (services tiers chargés
              dans des iframes). Ces services sont susceptibles de déposer leurs
              propres cookies sur votre terminal. La Plateforme n'a aucun
              contrôle sur ces cookies tiers.
            </p>
            <p>
              Aucun cookie publicitaire ou de profilage commercial n'est déposé
              par la Plateforme. Pour plus de détails, consultez notre{' '}
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
              (Discord, Twitch, Toornament, sponsors, etc.). L'éditeur n'exerce
              aucun contrôle sur ces sites et décline toute responsabilité quant
              à leur contenu, leur disponibilité ou leurs pratiques en matière
              de protection des données. La mise en place d'un lien hypertexte
              vers la Plateforme nécessite l'autorisation préalable écrite de
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
                <span className="text-zinc-300">Polices :</span> Inter (SIL Open
                Font License) — auto-hébergée via Next.js, aucune requête
                externe vers Google ; Paladins (police locale)
              </li>
            </ul>
          </LegalSection>
        </div>
      </div>
    </div>
  )
}

export default LegalPage
