/**
 * File: app/(public)/rules/page.tsx
 * Description: Tournament rules page.
 * Author: Noé Henchoz
 * Date: 2025-12-08
 * License: MIT
 */

import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/layout/legal-page-layout'

export const metadata: Metadata = {
  title: 'Règlement',
  description: 'Règlement officiel des tournois Belouga.',
}

export default function RulesPage() {
  return (
    <LegalPageLayout
      title="Règlement"
      description="Règlement officiel régissant tous les tournois organisés sur la plateforme."
    >
      <h2>Conditions de Participation</h2>
      <p>
        La participation aux tournois est ouverte à tous les joueurs respectant
        les critères d'éligibilité définis pour chaque événement. Chaque joueur
        doit posséder un compte valide et être en règle avec les conditions
        d'utilisation de la plateforme.
      </p>
      <ul>
        <li>Avoir un compte vérifié.</li>
        <li>Respecter l'âge minimum requis (si applicable).</li>
        <li>Ne pas être sous le coup d'une suspension active.</li>
      </ul>

      <h2>Déroulement des Matchs</h2>
      <p>
        Les matchs doivent être joués à l'heure indiquée. Tout retard supérieur
        à 15 minutes peut entraîner une disqualification. Les résultats doivent
        être reportés immédiatement après la fin de la rencontre, accompagnés
        des preuves nécessaires (captures d'écran).
      </p>

      <h2>Comportement et Fair-play</h2>
      <p>
        Un comportement respectueux est exigé envers les adversaires, les
        coéquipiers et les administrateurs. Tout propos injurieux,
        discriminatoire ou toxique sera sanctionné, pouvant aller jusqu'au
        bannissement définitif.
      </p>

      <h2>Infractions et Sanctions</h2>
      <p>
        Les administrateurs se réservent le droit d'appliquer des sanctions en
        cas de triche, d'exploitation de bugs, ou de tout autre comportement
        nuisant à l'intégrité de la compétition.
      </p>

      <h2>Récompenses</h2>
      <p>
        Les récompenses (cashprize) sont versées dans un délai de 30 jours après
        la validation des résultats finaux. Les gagnants doivent fournir les
        informations nécessaires pour le paiement.
      </p>
    </LegalPageLayout>
  )
}
