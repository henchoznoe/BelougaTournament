/**
 * File: components/public/tournaments/tournament-detail.tsx
 * Description: Public tournament sections with in-flow registration and verified user feedback.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { ChevronLeft, ScrollText, Shield, Users } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { usePublicSession } from '@/components/providers/public-session-provider'
import { RegistrationShortcut } from '@/components/public/tournaments/detail/registration-shortcut'
import { ContentCard } from '@/components/public/tournaments/detail/tournament-detail-shared'
import { TournamentHeroGallery } from '@/components/public/tournaments/detail/tournament-hero-gallery'
import { TournamentPrizeBanner } from '@/components/public/tournaments/detail/tournament-prize-banner'
import {
  TournamentRegistrantsSolo,
  TournamentRegistrantsTeam,
} from '@/components/public/tournaments/detail/tournament-registrants'
import { TournamentRegistrationSection } from '@/components/public/tournaments/detail/tournament-registration-section'
import { TournamentTabs } from '@/components/public/tournaments/detail/tournament-tabs'
import { PaymentReturnFeedback } from '@/components/public/tournaments/payment-return-feedback'
import { useRegistrationState } from '@/components/public/tournaments/use-registration-state'
import { ActionFeedback } from '@/components/ui/action-feedback'
import { Button } from '@/components/ui/button'
import { PendingLink as Link } from '@/components/ui/pending-link'
import { RichText } from '@/components/ui/rich-text'
import { ROUTES } from '@/lib/config/routes'
import type {
  AvailableTeam,
  PublicTournamentDetail,
  PublicTournamentRegistrant,
  PublicTournamentTeamRegistrant,
} from '@/lib/types/tournament'
import { pluralize } from '@/lib/utils/formatting'
import { getRegistrationCapacity } from '@/lib/utils/registration-feedback'
import {
  extractTwitchChannel,
  getTournamentRegistrationBadge,
} from '@/lib/utils/tournament-status'
import {
  RegistrationStatus,
  TournamentFormat,
} from '@/prisma/generated/prisma/enums'

interface TournamentDetailProps {
  tournament: PublicTournamentDetail
  twitchUsername?: string
  availableTeams: AvailableTeam[]
  registrants: PublicTournamentRegistrant[]
  teamRegistrants: PublicTournamentTeamRegistrant[]
}

export const TournamentDetail = ({
  tournament,
  twitchUsername,
  availableTeams,
  registrants,
  teamRegistrants,
}: TournamentDetailProps) => {
  const { isPending: sessionPending, sessionUser } = usePublicSession()
  const {
    state: registrationState,
    loading: registrationStateLoading,
    error: registrationStateError,
    reload,
  } = useRegistrationState(tournament.id, sessionUser?.id)
  const searchParams = useSearchParams()
  const [paymentReturned] = useState(searchParams.get('stripe') === 'success')
  const awaitingPaymentConfirmation =
    Boolean(sessionUser) &&
    paymentReturned &&
    registrationState?.status !== RegistrationStatus.CONFIRMED
  const loadRegistrationState = async () => {
    await reload()
  }

  useEffect(() => {
    if (!tournament.id || !window.location.hash) return
    const id = window.location.hash.slice(1)
    const target = document.getElementById(id)
    if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [tournament.id])

  const capacity = getRegistrationCapacity(tournament, availableTeams.length)
  const windowBadge = getTournamentRegistrationBadge(tournament)
  const registrationBadge =
    windowBadge.isOpen && capacity === 'full'
      ? {
          ...windowBadge,
          isOpen: false,
          label: 'Tournoi complet',
          className: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
        }
      : windowBadge
  const registrationLabel =
    registrationState?.status === RegistrationStatus.CONFIRMED
      ? 'Mon inscription'
      : !registrationBadge.isOpen
        ? 'Voir les inscriptions'
        : capacity === 'join-only'
          ? 'Rejoindre une équipe'
          : 'S’inscrire'

  const twitchChannel = tournament.streamUrl
    ? extractTwitchChannel(tournament.streamUrl)
    : twitchUsername

  const registrantCount =
    tournament.format === TournamentFormat.SOLO
      ? tournament._count.registrations
      : tournament._count.teams

  const registrantLabel =
    tournament.format === TournamentFormat.SOLO ? 'inscrit' : 'équipe'

  const registrantCountText = tournament.maxTeams
    ? `${registrantCount} / ${tournament.maxTeams}`
    : `${registrantCount} ${registrantLabel}${pluralize(registrantCount)}`

  return (
    <div className="mx-auto w-full max-w-(--content-width) space-y-8 pb-24 pt-28 px-4 lg:pb-8 lg:pt-32">
      {/* Back link */}
      <Link
        href={ROUTES.TOURNAMENTS}
        className="group inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors duration-300 hover:text-white"
      >
        <ChevronLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        Retour aux tournois
      </Link>

      {/* Hero carousel */}
      <TournamentHeroGallery
        tournament={tournament}
        registrationBadge={registrationBadge}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/3 p-4">
        <p className="text-sm text-zinc-300">
          {tournament.format === TournamentFormat.TEAM
            ? 'Chaque joueur s’inscrit dans son équipe et règle sa propre participation si le tournoi est payant.'
            : 'Réservez votre place pour participer au tournoi.'}
        </p>
        <Button asChild>
          <a href="#inscription">{registrationLabel}</a>
        </Button>
      </div>
      <nav
        aria-label="Sections du tournoi"
        className="flex flex-wrap gap-2 text-sm"
      >
        {[
          ['inscription', 'Inscription'],
          ...(tournament.description ? [['presentation', 'Présentation']] : []),
          ...(tournament.prize ? [['recompenses', 'Récompenses']] : []),
          ...(tournament.rules ? [['reglement', 'Règlement']] : []),
          ...(tournament.showRegistrants ? [['inscrits', 'Participants']] : []),
          ['diffusion', 'Stream et bracket'],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-full border border-white/15 px-4 py-2 text-zinc-300 transition-colors hover:border-brand/50 hover:text-white"
          >
            {label}
          </a>
        ))}
      </nav>
      <section
        id="inscription"
        aria-label="Inscription au tournoi"
        className="section-anchor space-y-4"
      >
        <PaymentReturnFeedback
          tournamentId={tournament.id}
          state={registrationState}
          loading={sessionPending || registrationStateLoading}
          error={registrationStateError}
          onRefresh={reload}
        />
        {awaitingPaymentConfirmation && !registrationStateError ? (
          <ActionFeedback title="Votre retour de paiement est en cours de vérification">
            <p>
              Actualisez votre inscription ci-dessus pour suivre sa
              confirmation. Évitez de lancer un nouveau paiement.
            </p>
          </ActionFeedback>
        ) : (
          <TournamentRegistrationSection
            tournament={tournament}
            registrationPhase={registrationBadge.phase}
            registrationState={registrationState}
            isAuthenticated={Boolean(sessionUser)}
            registrationStateLoading={
              sessionPending || registrationStateLoading
            }
            registrationStateError={registrationStateError}
            onRegistrationChanged={loadRegistrationState}
            availableTeams={availableTeams}
          />
        )}
      </section>
      <div className="mx-auto min-w-0 max-w-(--reading-width) space-y-6">
        {/* Description */}
        {tournament.description && (
          <section
            id="presentation"
            aria-label="Présentation"
            className="section-anchor"
          >
            <ContentCard icon={ScrollText} title="Présentation">
              <RichText content={tournament.description} />
            </ContentCard>
          </section>
        )}

        {tournament.prize && (
          <section
            id="recompenses"
            aria-label="Récompenses"
            className="section-anchor"
          >
            <TournamentPrizeBanner prize={tournament.prize} />
          </section>
        )}
        {tournament.rules && (
          <section
            id="reglement"
            aria-label="Règlement"
            className="section-anchor"
          >
            <ContentCard icon={Shield} title="Règlement">
              <RichText content={tournament.rules} />
            </ContentCard>
          </section>
        )}

        {/* No description or rules */}
        {!tournament.description && !tournament.rules && (
          <div className="rounded-3xl border border-white/5 bg-white/2 p-8 text-center">
            <p className="text-sm text-zinc-500">
              Aucun détail supplémentaire pour ce tournoi.
            </p>
          </div>
        )}

        {/* Registrants section */}
        {tournament.showRegistrants && (
          <section
            id="inscrits"
            aria-label="Participants"
            className="section-anchor"
          >
            <ContentCard
              icon={Users}
              title="Inscrits"
              titleExtra={
                <span className="ml-auto text-xs font-normal text-zinc-500">
                  {registrantCountText}
                </span>
              }
            >
              {tournament.format === TournamentFormat.TEAM ? (
                <TournamentRegistrantsTeam teams={teamRegistrants} />
              ) : (
                <TournamentRegistrantsSolo registrants={registrants} />
              )}
            </ContentCard>
          </section>
        )}

        {/* Stream & Bracket tabs */}
        <section
          id="diffusion"
          aria-label="Stream et bracket"
          className="section-anchor"
        >
          <TournamentTabs
            tournament={tournament}
            twitchChannel={twitchChannel}
          />
        </section>
      </div>
      <RegistrationShortcut label={registrationLabel} />
    </div>
  )
}
