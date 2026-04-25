/**
 * File: app/(public)/privacy/page.tsx
 * Description: Privacy policy page (Politique de confidentialité).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalSection } from '@/components/public/legal/legal-section'
import { PageHeader } from '@/components/ui/page-header'
import { CONTACT_EMAIL, METADATA, OWNER } from '@/lib/config/constants'
import { ROUTES } from '@/lib/config/routes'

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
          description="Politique de confidentialité et de protection des données personnelles. Dernière mise à jour : 25 avril 2026."
        />

        <div className="space-y-6">
          <LegalSection title="1. Responsable du traitement">
            <p>
              Le responsable du traitement des données personnelles collectées
              via la plateforme {METADATA.NAME} est :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Nom :</span> {OWNER.NAME}
              </li>
              <li>
                <span className="text-zinc-300">Domicile :</span> Canton de
                Fribourg, Suisse
              </li>
              <li>
                <span className="text-zinc-300">Contact :</span>{' '}
                <Link
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  {CONTACT_EMAIL}
                </Link>
              </li>
            </ul>
            <p className="text-sm text-zinc-400">
              En tant que projet géré par une personne physique, {METADATA.NAME}{' '}
              n'est pas tenu de désigner un Délégué à la Protection des Données
              (DPO). Pour toute question relative à vos données, contactez
              directement le responsable du traitement à l'adresse ci-dessus.
            </p>
          </LegalSection>

          <LegalSection title="2. Données collectées">
            <p>
              Lors de votre inscription et de votre utilisation de la
              Plateforme, nous collectons les données suivantes :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">
                  Données d'identification Discord :
                </span>{' '}
                Identifiant Discord (snowflake), nom d'utilisateur, adresse
                e-mail, URL de l'avatar — transmises par Discord lors de
                l'authentification OAuth 2.0
              </li>
              <li>
                <span className="text-zinc-300">Données de profil :</span> Nom
                d'affichage personnalisé (modifiable par l'utilisateur)
              </li>
              <li>
                <span className="text-zinc-300">Données de session :</span>{' '}
                Adresse IP, user-agent (navigateur / système d'exploitation),
                jetons de session chiffrés, dates et heures de connexion
              </li>
              <li>
                <span className="text-zinc-300">Données de tournoi :</span>{' '}
                Inscriptions aux tournois, compositions d'équipe, classements,
                éventuels champs personnalisés remplis lors de l'inscription
                (dont le contenu dépend de chaque tournoi)
              </li>
              <li>
                <span className="text-zinc-300">
                  Données de paiement (tournois payants uniquement) :
                </span>{' '}
                Identifiant de session Stripe, identifiant de paiement (Payment
                Intent), identifiant de charge, identifiant client Stripe,
                montant, devise, frais de traitement Stripe, don éventuel, et
                statut du paiement. Ces identifiants sont des références
                techniques transmises par Stripe — aucune donnée bancaire
                (numéro de carte, IBAN, etc.) n'est stockée sur les serveurs de
                la Plateforme
              </li>
              <li>
                <span className="text-zinc-300">
                  Données du formulaire de contact :
                </span>{' '}
                Nom complet, adresse e-mail, numéro de téléphone (optionnel),
                sujet et message. Ces données sont transmises par e-mail via le
                service Resend et ne sont <strong>pas stockées</strong> dans la
                base de données de la Plateforme
              </li>
              <li>
                <span className="text-zinc-300">Fichiers uploadés :</span> Logos
                d'équipe, images de tournois et logos de sponsors. Ces fichiers
                sont stockés sur Vercel Blob et accessibles via des URL
                publiques
              </li>
              <li>
                <span className="text-zinc-300">
                  Données d'analyse et de suivi (PostHog) :
                </span>{' '}
                Pages visitées, événements d'interaction (inscription à un
                tournoi, désinscription, connexion, lancement de paiement,
                modification du profil), exceptions JavaScript, et
                enregistrements de session (voir section 9). Lorsque vous êtes
                connecté(e), ces données sont associées à votre identifiant
                utilisateur
              </li>
            </ul>
            <p>
              Nous ne collectons aucun document d'identité officiel, aucune
              donnée de géolocalisation précise, et n'effectuons aucun profilage
              ni prise de décision automatisée produisant des effets juridiques
              sur les utilisateurs.
            </p>
          </LegalSection>

          <LegalSection title="3. Finalités du traitement">
            <p>
              Vos données personnelles sont traitées pour les finalités
              suivantes :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                Gestion de votre compte utilisateur et authentification
                sécurisée via Discord OAuth 2.0
              </li>
              <li>Organisation, administration et archivage des tournois</li>
              <li>
                Traitement des paiements et gestion des remboursements pour les
                tournois payants
              </li>
              <li>Traitement de vos demandes via le formulaire de contact</li>
              <li>
                Modération de la communauté et application des sanctions prévues
                aux{' '}
                <Link
                  href={ROUTES.TERMS}
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  CGU
                </Link>
              </li>
              <li>
                Analyse d'audience et amélioration de la Plateforme via PostHog
                (événements d'utilisation, mesure de performance) et Vercel
                Analytics (données anonymes et agrégées)
              </li>
              <li>
                Surveillance des erreurs et amélioration de la stabilité via
                PostHog (capture automatique des exceptions JavaScript)
              </li>
              <li>
                Enregistrement de session (session replay) à des fins de
                débogage et d'amélioration de l'expérience utilisateur (voir
                section 9)
              </li>
              <li>Prévention de la fraude et sécurité de la Plateforme</li>
            </ul>
          </LegalSection>

          <LegalSection title="4. Base légale">
            <p>
              Le traitement de vos données repose sur les bases légales
              suivantes :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">
                  Consentement (art. 6.1.a RGPD / art. 31 al. 1 LPD) :
                </span>{' '}
                Lors de votre inscription via Discord OAuth — vous consentez
                explicitement à transmettre vos données Discord à la Plateforme
              </li>
              <li>
                <span className="text-zinc-300">
                  Exécution d'un contrat (art. 6.1.b RGPD / LPD) :
                </span>{' '}
                Pour la gestion de votre participation aux tournois, le
                traitement des paiements, la gestion des remboursements et
                l'exécution des CGU
              </li>
              <li>
                <span className="text-zinc-300">
                  Intérêt légitime (art. 6.1.f RGPD / art. 31 al. 1 LPD) :
                </span>{' '}
                Pour la sécurité et la modération de la Plateforme, l'analyse
                d'audience (PostHog, Vercel Analytics), l'enregistrement de
                session à des fins de débogage et d'amélioration de
                l'expérience, ainsi que la surveillance des erreurs
              </li>
              <li>
                <span className="text-zinc-300">
                  Obligation légale (art. 6.1.c RGPD / LPD) :
                </span>{' '}
                Conservation des données de paiement conformément aux
                obligations comptables et fiscales applicables (art. 958f CO)
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="5. Sous-traitants et transferts de données">
            <p>
              Vos données personnelles ne sont jamais vendues à des tiers. Elles
              peuvent être partagées avec les sous-traitants suivants, dans la
              stricte mesure nécessaire à la fourniture du service :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">
                  Vercel Inc. (États-Unis) :
                </span>{' '}
                Hébergement de la Plateforme, stockage des fichiers (Vercel
                Blob), mesure d'audience anonyme (Vercel Analytics) et mesure de
                performance (Vercel Speed Insights). Vercel est certifié
                conforme au EU-U.S. Data Privacy Framework. Politique de
                confidentialité :{' '}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  vercel.com/legal/privacy-policy
                </a>
              </li>
              <li>
                <span className="text-zinc-300">
                  Supabase Inc. (Singapour — données hébergées en Suisse) :
                </span>{' '}
                Hébergement de la base de données PostgreSQL contenant les
                données utilisateurs, les données de tournoi, les sessions et
                les références de paiement. Les données sont stockées dans la
                région Zurich (eu-central-2), en Suisse. Politique de
                confidentialité :{' '}
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  supabase.com/privacy
                </a>
              </li>
              <li>
                <span className="text-zinc-300">
                  Discord Inc. (États-Unis) :
                </span>{' '}
                Service d'authentification OAuth 2.0. Seules les données que
                vous autorisez via Discord sont transmises. Politique de
                confidentialité :{' '}
                <a
                  href="https://discord.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  discord.com/privacy
                </a>
              </li>
              <li>
                <span className="text-zinc-300">
                  Stripe, Inc. (États-Unis) :
                </span>{' '}
                Prestataire de paiement tiers pour les tournois payants. Stripe
                traite les données de paiement en son nom propre et est certifié
                PCI DSS niveau 1. Aucune donnée bancaire n'est stockée sur les
                serveurs de la Plateforme. Politique de confidentialité :{' '}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  stripe.com/privacy
                </a>
              </li>
              <li>
                <span className="text-zinc-300">
                  PostHog Inc. (États-Unis — données hébergées dans l'UE) :
                </span>{' '}
                Analyse d'audience, suivi des événements, surveillance des
                erreurs et enregistrement de session. Les données sont traitées
                sur l'instance européenne de PostHog (eu.i.posthog.com) et
                transitent via un proxy first-party (/ingest) sur notre domaine.
                Politique de confidentialité :{' '}
                <a
                  href="https://posthog.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  posthog.com/privacy
                </a>
              </li>
              <li>
                <span className="text-zinc-300">
                  Resend, Inc. (États-Unis) :
                </span>{' '}
                Service d'envoi d'e-mails transactionnels pour le formulaire de
                contact. Les données du formulaire transitent par Resend mais ne
                sont pas stockées dans la base de données de la Plateforme.
                Politique de confidentialité :{' '}
                <a
                  href="https://resend.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  resend.com/legal/privacy-policy
                </a>
              </li>
              <li>
                <span className="text-zinc-300">
                  Toornament / Webedia (France) :
                </span>{' '}
                Widgets iframe intégrés pour l'affichage des brackets et
                résultats de tournois. Le widget peut déposer ses propres
                cookies. Politique de confidentialité :{' '}
                <a
                  href="https://www.toornament.com/en/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  toornament.com/privacy-policy
                </a>
              </li>
            </ul>
            <p>
              La base de données principale est hébergée en Suisse (Zurich) par
              Supabase. Les autres transferts vers des pays tiers (États-Unis)
              sont encadrés par des garanties appropriées (clauses
              contractuelles types de la Commission européenne, EU-U.S. Data
              Privacy Framework) assurant un niveau de protection équivalent aux
              standards suisses et européens.
            </p>
          </LegalSection>

          <LegalSection title="6. Durée de conservation">
            <p>Vos données sont conservées pendant les durées suivantes :</p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Compte utilisateur :</span> Tant
                que le compte est actif. En cas d'inactivité, les données
                peuvent être supprimées 1 an après la dernière connexion, après
                notification préalable
              </li>
              <li>
                <span className="text-zinc-300">Données de tournoi :</span> 2
                ans après la fin du tournoi, à des fins d'archivage et de
                résolution de litiges
              </li>
              <li>
                <span className="text-zinc-300">
                  Données de paiement (identifiants Stripe) :
                </span>{' '}
                10 ans après la transaction, conformément aux obligations
                légales en matière de comptabilité et de conservation des pièces
                justificatives (art. 958f CO)
              </li>
              <li>
                <span className="text-zinc-300">Logs de session :</span> 6 mois
              </li>
              <li>
                <span className="text-zinc-300">
                  Données de modération (sanctions) :
                </span>{' '}
                Durée du bannissement, puis 1 an supplémentaire
              </li>
              <li>
                <span className="text-zinc-300">
                  Données du formulaire de contact :
                </span>{' '}
                Non stockées dans la base de données de la Plateforme. Les
                e-mails sont conservés dans la boîte de réception de
                l'administrateur
              </li>
              <li>
                <span className="text-zinc-300">
                  Données d'analyse (PostHog) :
                </span>{' '}
                Selon la configuration du projet PostHog. Les enregistrements de
                session et les événements sont automatiquement supprimés après
                leur période de rétention configurée
              </li>
            </ul>
            <p>
              À l'issue de ces délais, vos données sont supprimées ou
              anonymisées de manière irréversible.
            </p>
          </LegalSection>

          <LegalSection title="7. Vos droits">
            <p>
              Conformément à la Loi fédérale sur la protection des données (LPD
              nLPD en vigueur depuis le 1er septembre 2023) et au Règlement
              Général sur la Protection des Données (RGPD), vous disposez des
              droits suivants :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Droit d'accès :</span> Obtenir
                une copie de vos données personnelles et des informations sur
                leur traitement
              </li>
              <li>
                <span className="text-zinc-300">Droit de rectification :</span>{' '}
                Corriger des données inexactes ou incomplètes
              </li>
              <li>
                <span className="text-zinc-300">
                  Droit à l'effacement (« droit à l'oubli ») :
                </span>{' '}
                Demander la suppression de vos données dans les cas prévus par
                la loi (sous réserve des obligations de conservation légales,
                notamment pour les données de paiement)
              </li>
              <li>
                <span className="text-zinc-300">Droit à la portabilité :</span>{' '}
                Recevoir vos données dans un format structuré, couramment
                utilisé et lisible par machine
              </li>
              <li>
                <span className="text-zinc-300">Droit d'opposition :</span> Vous
                opposer au traitement de vos données fondé sur l'intérêt
                légitime
              </li>
              <li>
                <span className="text-zinc-300">
                  Droit à la limitation du traitement :
                </span>{' '}
                Demander la suspension du traitement dans certaines
                circonstances
              </li>
              <li>
                <span className="text-zinc-300">
                  Droit de retrait du consentement :
                </span>{' '}
                Retirer votre consentement à tout moment, sans que cela
                n'affecte la licéité du traitement antérieur
              </li>
            </ul>
            <p>
              Pour exercer vos droits, adressez votre demande par e-mail à{' '}
              <Link
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-blue-400 transition-colors hover:text-blue-300"
              >
                {CONTACT_EMAIL}
              </Link>{' '}
              ou via le{' '}
              <Link
                href={ROUTES.CONTACT}
                className="text-blue-400 transition-colors hover:text-blue-300"
              >
                formulaire de contact
              </Link>
              . Nous nous engageons à répondre dans un délai de 30 jours.
            </p>
            <p>
              Vous avez également le droit de déposer une réclamation auprès de
              l'autorité de contrôle compétente :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                En Suisse :{' '}
                <a
                  href="https://www.edoeb.admin.ch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  Préposé fédéral à la protection des données et à la
                  transparence (PFPDT)
                </a>
              </li>
              <li>
                En France :{' '}
                <a
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  Commission nationale de l'informatique et des libertés (CNIL)
                </a>
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="8. Cookies et technologies de suivi">
            <p>La Plateforme utilise les cookies et technologies suivantes :</p>

            <p className="mt-2 font-medium text-zinc-300">
              Cookies first-party (déposés par belougatournament.ch) :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">
                  Cookies de session (belouga.*) :
                </span>{' '}
                Strictement nécessaires au fonctionnement de l'authentification.
                HttpOnly, Secure, SameSite=Lax. Durée : 7 jours. Ces cookies ne
                peuvent pas être désactivés sans empêcher l'utilisation de la
                Plateforme
              </li>
              <li>
                <span className="text-zinc-300">Cookies PostHog (ph_*) :</span>{' '}
                Identifiant anonyme permettant le suivi d'audience, le
                fonctionnement de l'enregistrement de session et la corrélation
                des événements. Ces cookies sont déposés sous intérêt légitime à
                des fins d'amélioration de la Plateforme et de surveillance des
                erreurs. Ils ne sont pas utilisés à des fins publicitaires ni de
                profilage commercial
              </li>
            </ul>

            <p className="mt-2 font-medium text-zinc-300">
              Services sans cookies :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Vercel Analytics :</span> Mesure
                d'audience entièrement anonyme, <strong>sans cookies</strong>,
                sans suivi inter-sites, sans collecte d'identifiants personnels.
                Conforme au RGPD et à la LPD sans consentement requis
              </li>
              <li>
                <span className="text-zinc-300">Vercel Speed Insights :</span>{' '}
                Mesure de performance web anonyme, <strong>sans cookies</strong>
                , sans identification des utilisateurs
              </li>
            </ul>

            <p className="mt-2 font-medium text-zinc-300">
              Cookies tiers (iframes) :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                <span className="text-zinc-300">Lecteur Twitch :</span> La page
                de streaming intègre un lecteur fourni par Twitch (Amazon /
                Twitch Interactive, Inc.), chargé dans une iframe. Ce lecteur
                est susceptible de déposer ses propres cookies (session,
                analytics, publicité). Ces cookies sont régis par la{' '}
                <a
                  href="https://www.twitch.tv/p/legal/privacy-notice/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  politique de confidentialité de Twitch
                </a>
              </li>
              <li>
                <span className="text-zinc-300">Widget Toornament :</span> Les
                pages de tournois peuvent intégrer un widget iframe fourni par
                Toornament (Webedia), susceptible de déposer ses propres
                cookies. Ces cookies sont régis par la{' '}
                <a
                  href="https://www.toornament.com/en/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  politique de confidentialité de Toornament
                </a>
              </li>
            </ul>
            <p>
              Vous pouvez bloquer les cookies tiers via les paramètres de votre
              navigateur sans affecter le fonctionnement principal de la
              Plateforme. Aucun cookie publicitaire ni de profilage commercial
              n'est déposé par la Plateforme elle-même.
            </p>
            <p className="text-sm text-zinc-400">
              Un mécanisme de consentement granulaire pourra être mis en place à
              l'avenir pour offrir un contrôle accru sur les cookies non
              strictement nécessaires.
            </p>
          </LegalSection>

          <LegalSection title="9. Enregistrement de session (Session Replay)">
            <p>
              La Plateforme utilise la fonctionnalité d'enregistrement de
              session (session replay) fournie par PostHog afin d'améliorer
              l'expérience utilisateur et de diagnostiquer les problèmes
              techniques. Cette fonctionnalité est activée uniquement en
              environnement de production.
            </p>
            <p className="font-medium text-zinc-300">Ce qui est enregistré :</p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                Mouvements de souris, clics, défilements et interactions avec
                les éléments de la page
              </li>
              <li>Snapshots du contenu DOM (structure visuelle de la page)</li>
              <li>Navigation entre les pages</li>
            </ul>
            <p className="font-medium text-zinc-300">
              Ce qui n'est PAS enregistré :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                Mots de passe et données saisies dans les champs sensibles
                (masquage automatique par PostHog)
              </li>
              <li>
                Données bancaires ou de carte de crédit (gérées exclusivement
                par Stripe dans sa propre iframe sécurisée)
              </li>
            </ul>
            <p>
              Lorsque vous êtes connecté(e), les enregistrements de session
              peuvent être associés à votre identifiant utilisateur afin de
              faciliter le diagnostic de problèmes signalés.
            </p>
            <p>
              <span className="text-zinc-300">Base légale :</span> Intérêt
              légitime (art. 6.1.f RGPD / art. 31 al. 1 LPD) — amélioration de
              la Plateforme et résolution de bugs.
            </p>
            <p>
              <span className="text-zinc-300">Hébergement :</span> Les données
              sont traitées sur l'instance européenne de PostHog
              (eu.i.posthog.com).
            </p>
            <p>
              Vous pouvez bloquer l'enregistrement de session en désactivant
              JavaScript dans votre navigateur ou en utilisant une extension
              bloquant les scripts PostHog.
            </p>
          </LegalSection>

          <LegalSection title="10. Sécurité">
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles
              appropriées pour protéger vos données contre tout accès non
              autorisé, perte, altération ou divulgation :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                Chiffrement des communications en transit (HTTPS / TLS 1.3)
              </li>
              <li>
                Authentification sécurisée via OAuth 2.0 — aucun mot de passe
                stocké sur la Plateforme
              </li>
              <li>
                Accès aux données restreint par rôle (USER, ADMIN, SUPER_ADMIN)
              </li>
              <li>
                Surveillance des erreurs et alertes de sécurité via PostHog
              </li>
              <li>
                Infrastructure hébergée chez Vercel, certifiée SOC 2 Type II et
                ISO 27001
              </li>
              <li>
                Paiements traités par Stripe, certifié PCI DSS niveau 1 — aucune
                donnée bancaire ne transite par nos serveurs
              </li>
              <li>
                Limitation de débit (rate limiting) en production pour prévenir
                les attaques par force brute
              </li>
              <li>
                En-têtes de sécurité HTTP (HSTS, CSP, X-Frame-Options,
                Permissions-Policy)
              </li>
            </ul>
            <p>
              En cas de violation de données à caractère personnel susceptible
              d'engendrer un risque pour vos droits et libertés, nous nous
              engageons à notifier l'autorité de contrôle compétente dans les
              délais légaux prévus (72 heures pour le RGPD), et à vous en
              informer directement si le risque est élevé.
            </p>
          </LegalSection>

          <LegalSection title="11. Mineurs">
            <p>
              La Plateforme est accessible aux personnes âgées d'au moins 16
              ans. Nous ne collectons pas sciemment de données personnelles
              concernant des enfants de moins de 16 ans. Si vous êtes parent ou
              tuteur légal et que vous pensez que votre enfant nous a fourni des
              données personnelles sans votre consentement, contactez-nous à{' '}
              <Link
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-blue-400 transition-colors hover:text-blue-300"
              >
                {CONTACT_EMAIL}
              </Link>{' '}
              afin que nous puissions prendre les mesures nécessaires.
            </p>
          </LegalSection>

          <LegalSection title="12. Modifications">
            <p>
              Cette politique de confidentialité peut être modifiée à tout
              moment pour refléter des évolutions légales, réglementaires ou
              techniques. En cas de modification substantielle affectant vos
              droits, les utilisateurs en seront informés via la Plateforme. La
              date de dernière mise à jour est indiquée en haut de cette page.
            </p>
            <p>
              Nous vous encourageons à consulter régulièrement cette page. La
              poursuite de l'utilisation de la Plateforme après une modification
              vaut acceptation de la politique mise à jour.
            </p>
          </LegalSection>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPage
