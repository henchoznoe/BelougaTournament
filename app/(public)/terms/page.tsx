/**
 * File: app/(public)/terms/page.tsx
 * Description: Terms of service page.
 * Author: Noé Henchoz
 * Date: 2025-12-08
 * License: MIT
 */

import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/layout/legal-page-layout'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description:
    "Conditions régissant l'utilisation de la plateforme Belouga Tournament.",
}

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Conditions Générales"
      description="En accédant à ce site, vous acceptez les présentes conditions générales d'utilisation."
    >
      <h2>Objet</h2>
      <p>
        Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de
        définir les modalités de mise à disposition des services du site Belouga
        Tournament et les conditions d'utilisation du service par l'Utilisateur.
      </p>

      <h2>Accès au Service</h2>
      <p>
        Le service est accessible gratuitement à tout Utilisateur disposant d'un
        accès à internet. Tous les coûts afférents à l'accès au service, que ce
        soient les frais matériels, logiciels ou d'accès à internet sont
        exclusivement à la charge de l'Utilisateur.
      </p>

      <h2>Compte Utilisateur</h2>
      <p>
        L'Utilisateur est responsable du maintien de la confidentialité de ses
        identifiants de connexion. Toute action effectuée via son compte est
        réputée avoir été effectuée par lui-même.
      </p>

      <h2>Responsabilité</h2>
      <p>
        Les informations diffusées sur le site sont présentées à titre
        informatif. L'éditeur ne peut être tenu responsable de l'utilisation
        faite des informations présentes sur le site, ni de tout préjudice
        direct ou indirect pouvant en découler.
      </p>

      <h2>Propriété Intellectuelle</h2>
      <p>
        Les marques, logos, signes ainsi que tout le contenu du site (textes,
        images, son...) font l'objet d'une protection par le Code de la
        propriété intellectuelle et plus particulièrement par le droit d'auteur.
      </p>

      <h2>Droit Applicable</h2>
      <p>
        Les présentes CGU sont soumises au droit français. En cas de litige non
        résolu à l'amiable, les tribunaux français seront seuls compétents.
      </p>
    </LegalPageLayout>
  )
}
