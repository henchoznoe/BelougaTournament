/**
 * File: app/(public)/terms/page.tsx
 * Description: Terms and conditions page (CGU).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalSection } from '@/components/public/legal/legal-section'
import { PageHeader } from '@/components/ui/page-header'
import { CONTACT_EMAIL, METADATA } from '@/lib/config/constants'
import { ROUTES } from '@/lib/config/routes'

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
          description="Conditions générales d'utilisation de la plateforme Belouga Tournament. Dernière mise à jour : 25 avril 2026."
        />

        <div className="space-y-6">
          <LegalSection title="1. Objet et acceptation">
            <p>
              Les présentes Conditions Générales d'Utilisation (ci-après « CGU
              ») régissent l'accès et l'utilisation de la plateforme{' '}
              {METADATA.NAME} (ci-après « la Plateforme »), accessible à
              l'adresse{' '}
              <a
                href="https://belougatournament.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 transition-colors hover:text-blue-300"
              >
                belougatournament.ch
              </a>
              .
            </p>
            <p>
              La Plateforme permet l'organisation, la gestion et la
              participation à des tournois e-sport amateurs. Certains tournois
              sont accessibles gratuitement ; d'autres peuvent être soumis à des
              frais d'inscription dont les modalités sont définies à la section
              3 des présentes CGU.
            </p>
            <p>
              En accédant à la Plateforme ou en créant un compte, vous
              reconnaissez avoir lu, compris et accepté sans réserve les
              présentes CGU dans leur intégralité. Si vous n'acceptez pas ces
              CGU, vous ne devez pas utiliser la Plateforme.
            </p>
          </LegalSection>

          <LegalSection title="2. Inscription et compte utilisateur">
            <p>
              L'inscription sur la Plateforme s'effectue exclusivement via
              l'authentification Discord (OAuth 2.0). Aucune autre méthode
              d'inscription n'est disponible. En vous inscrivant, vous
              garantissez que :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                Vous êtes âgé(e) d'au moins 16 ans ; si vous êtes mineur(e),
                vous disposez de l'autorisation préalable et expresse de votre
                représentant légal pour utiliser la Plateforme
              </li>
              <li>
                Les informations associées à votre compte Discord (nom
                d'utilisateur, adresse e-mail, avatar) sont exactes et vous
                appartiennent
              </li>
              <li>
                Vous êtes seul(e) responsable de la sécurité et de la
                confidentialité de votre compte Discord
              </li>
              <li>
                Vous n'utiliserez pas la Plateforme au nom d'une tierce personne
                sans son autorisation explicite
              </li>
            </ul>
            <p>
              Chaque utilisateur ne peut posséder qu'un seul compte. La création
              de comptes multiples aux fins de contournement de sanctions est
              interdite. La Plateforme se réserve le droit de suspendre ou
              supprimer tout compte ne respectant pas les présentes CGU, sans
              préavis ni indemnité.
            </p>
            <p>
              Pour demander la suppression de votre compte, contactez l'éditeur
              à l'adresse{' '}
              <Link
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-blue-400 transition-colors hover:text-blue-300"
              >
                {CONTACT_EMAIL}
              </Link>
              . Les données seront traitées conformément à la{' '}
              <Link
                href={ROUTES.PRIVACY}
                className="text-blue-400 transition-colors hover:text-blue-300"
              >
                politique de confidentialité
              </Link>
              .
            </p>
          </LegalSection>

          <LegalSection title="3. Tarification et paiements">
            <p>
              L'accès à la Plateforme est gratuit. La participation à certains
              tournois peut être soumise à des{' '}
              <strong>frais d'inscription payants</strong>, dont le montant est
              fixé par l'organisateur et indiqué sur la page du tournoi avant
              toute inscription.
            </p>
            <p>Les paiements sont soumis aux règles suivantes :</p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                Les transactions sont effectuées en{' '}
                <strong>francs suisses (CHF)</strong> via{' '}
                <strong>Stripe</strong>, prestataire de paiement tiers sécurisé
              </li>
              <li>
                Lors de l'inscription, une session de paiement Stripe est
                ouverte et maintenue pendant <strong>30 minutes</strong>. Passé
                ce délai, la session expire et la place n'est plus réservée
              </li>
              <li>
                L'inscription n'est confirmée qu'à réception du paiement par
                Stripe. Tant que le paiement n'est pas complété, la
                participation au tournoi n'est pas garantie
              </li>
              <li>
                Aucune donnée bancaire ou de carte de crédit n'est stockée sur
                les serveurs de la Plateforme — ces données sont gérées
                exclusivement par Stripe
              </li>
            </ul>
            <p>
              Le traitement des paiements est soumis aux{' '}
              <a
                href="https://stripe.com/legal/ssa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 transition-colors hover:text-blue-300"
              >
                Conditions d'utilisation de Stripe
              </a>{' '}
              et à la{' '}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 transition-colors hover:text-blue-300"
              >
                Politique de confidentialité de Stripe
              </a>
              .
            </p>
          </LegalSection>

          <LegalSection title="4. Politique de remboursement">
            <p>
              Chaque tournoi payant dispose d'une{' '}
              <strong>politique de remboursement propre</strong>, configurée par
              l'organisateur et affichée sur la page du tournoi avant
              inscription. Les règles générales sont les suivantes :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                Si vous vous désinscrivez d'un tournoi{' '}
                <strong>avant la date limite de remboursement</strong> définie
                pour ce tournoi, vous serez remboursé(e) automatiquement du
                montant intégral des frais d'inscription via Stripe, sur le
                moyen de paiement utilisé lors de l'inscription
              </li>
              <li>
                Si vous vous désinscrivez{' '}
                <strong>après la date limite de remboursement</strong>, aucun
                remboursement ne sera effectué, sauf décision contraire de
                l'organisateur du tournoi
              </li>
              <li>
                En cas d'<strong>annulation du tournoi</strong> par
                l'organisateur, les participants inscrits ayant payé des frais
                d'inscription seront remboursés intégralement
              </li>
              <li>
                Les délais de remboursement via Stripe peuvent varier selon
                votre établissement bancaire (généralement 5 à 10 jours
                ouvrables)
              </li>
            </ul>
            <p>
              Conformément au droit suisse des obligations (CO), le{' '}
              <strong>droit de rétractation</strong> prévu par certaines
              législations européennes (directive 2011/83/UE) ne s'applique pas
              aux présentes CGU, régies exclusivement par le droit suisse. Aucun
              délai légal de rétractation n'est applicable à l'inscription aux
              tournois.
            </p>
            <p>
              Pour toute contestation relative à un remboursement, contactez
              l'éditeur à l'adresse{' '}
              <Link
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-blue-400 transition-colors hover:text-blue-300"
              >
                {CONTACT_EMAIL}
              </Link>
              .
            </p>
          </LegalSection>

          <LegalSection title="5. Participation aux tournois">
            <p>
              La participation aux tournois est soumise aux conditions suivantes
              :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                Disposer d'un compte actif sur la Plateforme et sur le jeu
                concerné
              </li>
              <li>
                L'inscription à un tournoi vaut acceptation du règlement
                spécifique de ce tournoi, qui prévaut sur les présentes CGU en
                cas de conflit
              </li>
              <li>
                Les joueurs doivent respecter les règles du jeu concerné, les
                conditions d'utilisation de l'éditeur du jeu, et les principes
                du fair-play
              </li>
              <li>
                Toute forme de triche, d'exploitation de failles (exploit), de
                comportement toxique, de harcèlement ou d'utilisation de
                logiciels tiers non autorisés est strictement interdite
              </li>
              <li>
                Les décisions des administrateurs et arbitres sont définitives
                et sans appel, sauf procédure de contestation prévue dans le
                règlement du tournoi
              </li>
              <li>
                L'éditeur se réserve le droit d'annuler, de reporter ou de
                modifier un tournoi en cas de force majeure ou de circonstances
                exceptionnelles
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="6. Comportement et règles de conduite">
            <p>
              Les utilisateurs s'engagent à adopter un comportement respectueux
              envers les autres participants, les administrateurs et l'éditeur.
              Sont notamment interdits :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                Tout propos haineux, discriminatoires, menaçants ou à caractère
                illicite
              </li>
              <li>
                La publication de contenus portant atteinte aux droits d'un
                tiers
              </li>
              <li>
                Toute tentative d'atteinte à la sécurité ou au bon
                fonctionnement de la Plateforme
              </li>
              <li>L'usurpation d'identité</li>
              <li>
                Toute activité commerciale ou publicitaire non autorisée sur la
                Plateforme
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="7. Sanctions">
            <p>
              En cas de non-respect des présentes CGU ou du règlement d'un
              tournoi, les administrateurs peuvent appliquer des sanctions
              graduées selon la gravité de l'infraction :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>Un avertissement formel</li>
              <li>
                La disqualification d'un tournoi en cours, avec perte des
                éventuelles récompenses associées
              </li>
              <li>Un bannissement temporaire de la Plateforme</li>
              <li>
                Un bannissement permanent en cas de récidive ou de faute grave
              </li>
            </ul>
            <p>
              Les sanctions sont appliquées à la discrétion des administrateurs.
              Un motif est systématiquement communiqué à l'utilisateur concerné.
              L'utilisateur peut contester une sanction en contactant l'éditeur
              à l'adresse{' '}
              <Link
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-blue-400 transition-colors hover:text-blue-300"
              >
                {CONTACT_EMAIL}
              </Link>
              .
            </p>
          </LegalSection>

          <LegalSection title="8. Propriété intellectuelle">
            <p>
              L'ensemble des éléments de la Plateforme (design, code, textes,
              logos, graphismes) est la propriété de l'éditeur ou de ses
              partenaires et est protégé par le droit de la propriété
              intellectuelle. Toute reproduction, distribution, modification ou
              utilisation non autorisée est interdite.
            </p>
            <p>
              Les noms de jeux, logos et marques associés sont la propriété
              exclusive de leurs détenteurs respectifs et sont utilisés à titre
              informatif uniquement.
            </p>
            <p>
              En publiant du contenu sur la Plateforme (pseudonymes,
              compositions d'équipe, etc.), l'utilisateur accorde à l'éditeur un
              droit d'utilisation non exclusif pour les besoins du
              fonctionnement et de la promotion de la Plateforme.
            </p>
          </LegalSection>

          <LegalSection title="9. Disponibilité du service">
            <p>
              L'éditeur s'efforce de maintenir la Plateforme accessible en
              continu, mais ne garantit pas une disponibilité ininterrompue. La
              Plateforme peut être temporairement indisponible pour cause de
              maintenance, mise à jour, ou incident technique.
            </p>
            <p>
              L'éditeur ne saurait être tenu responsable des interruptions de
              service, qu'elles soient planifiées ou non, ni de leurs
              conséquences sur la participation aux tournois. Aucune indemnité
              ne pourra être réclamée à ce titre.
            </p>
          </LegalSection>

          <LegalSection title="10. Limitation de responsabilité">
            <p>
              La Plateforme est fournie « en l'état » et « selon disponibilité
              ». {METADATA.NAME} ne garantit pas un fonctionnement ininterrompu
              ou exempt d'erreurs. En aucun cas {METADATA.NAME} ne pourra être
              tenu responsable de :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>Pertes de données liées à l'utilisation de la Plateforme</li>
              <li>Interruptions de service indépendantes de sa volonté</li>
              <li>Litiges entre participants lors des tournois</li>
              <li>
                Problèmes techniques liés aux jeux ou services tiers (Discord,
                serveurs de jeux, etc.)
              </li>
              <li>
                Pertes de gains espérés ou préjudices indirects de quelque
                nature que ce soit
              </li>
              <li>
                Dysfonctionnements ou indisponibilités du service Stripe
                affectant le traitement des paiements
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="11. Force majeure">
            <p>
              L'éditeur ne pourra être tenu responsable de l'inexécution totale
              ou partielle de ses obligations au titre des présentes CGU,
              lorsque cette inexécution est due à un événement de force majeure,
              entendu comme tout événement imprévisible, irrésistible et
              extérieur à la volonté de l'éditeur, incluant notamment :
              catastrophes naturelles, pannes d'infrastructure, actes de
              cybermalveillance, décisions gouvernementales, ou défaillance de
              services tiers essentiels.
            </p>
          </LegalSection>

          <LegalSection title="12. Modification des CGU">
            <p>
              {METADATA.NAME} se réserve le droit de modifier les présentes CGU
              à tout moment. Les utilisateurs seront informés de toute
              modification substantielle via la Plateforme. La date de dernière
              mise à jour est indiquée en haut de cette page. L'utilisation
              continue de la Plateforme après modification vaut acceptation des
              nouvelles CGU.
            </p>
          </LegalSection>

          <LegalSection title="13. Divisibilité">
            <p>
              Si l'une quelconque des dispositions des présentes CGU était
              déclarée nulle ou non applicable par une juridiction compétente,
              les autres dispositions resteraient en vigueur et de plein effet.
              La disposition nulle serait alors remplacée par une disposition
              valide se rapprochant au plus de l'intention des parties.
            </p>
          </LegalSection>

          <LegalSection title="14. Droit applicable">
            <p>
              Les présentes CGU sont soumises au droit suisse. En cas de litige
              relatif à leur interprétation ou leur exécution, et à défaut de
              résolution amiable, les tribunaux du canton de Fribourg (Suisse)
              seront seuls compétents, sauf disposition légale impérative
              contraire.
            </p>
          </LegalSection>

          <LegalSection title="15. Contact">
            <p>
              Pour toute question relative aux présentes CGU, ou pour exercer
              vos droits, vous pouvez nous contacter :
            </p>
            <ul className="list-inside list-disc space-y-1 pl-2">
              <li>
                Par e-mail :{' '}
                <Link
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-blue-400 transition-colors hover:text-blue-300"
                >
                  {CONTACT_EMAIL}
                </Link>
              </li>
              <li>Via le formulaire de contact disponible sur la Plateforme</li>
              <li>Via notre serveur Discord officiel</li>
            </ul>
          </LegalSection>
        </div>
      </div>
    </div>
  )
}

export default TermsPage
