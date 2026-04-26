/**
 * File: components/public/tournaments/detail/tournament-registrants.tsx
 * Description: Public registrant list for tournaments with showRegistrants enabled.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { User, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ROUTES } from '@/lib/config/routes'
import type {
  PublicTournamentRegistrant,
  PublicTournamentTeamRegistrant,
} from '@/lib/types/tournament'

interface TournamentRegistrantsSoloProps {
  registrants: PublicTournamentRegistrant[]
}

const PlayerAvatar = ({
  image,
  name,
  size = 32,
}: {
  image: string | null
  name: string
  size?: number
}) =>
  image ? (
    <Image
      src={image}
      alt={name}
      width={size}
      height={size}
      className="rounded-full ring-1 ring-white/10"
    />
  ) : (
    <div
      className="flex items-center justify-center rounded-full bg-zinc-800 ring-1 ring-white/10"
      style={{ width: size, height: size }}
    >
      <User className="size-4 text-zinc-500" />
    </div>
  )

const PlayerName = ({ player }: { player: PublicTournamentRegistrant }) => {
  if (player.isPublic) {
    return (
      <Link
        href={ROUTES.PLAYER_DETAIL(player.userId)}
        className="truncate text-sm font-medium text-white transition-colors hover:text-blue-400"
      >
        {player.displayName}
      </Link>
    )
  }
  return (
    <span className="truncate text-sm font-medium text-zinc-300">
      {player.displayName}
    </span>
  )
}

export const TournamentRegistrantsSolo = ({
  registrants,
}: TournamentRegistrantsSoloProps) => {
  if (registrants.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="inline-flex rounded-full bg-white/5 p-4 ring-1 ring-white/10">
          <Users className="size-8 text-zinc-500" />
        </div>
        <p className="text-sm text-zinc-500">Aucun inscrit pour le moment</p>
      </div>
    )
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {registrants.map(player => (
        <div
          key={player.userId}
          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/2 px-3 py-2"
        >
          <PlayerAvatar image={player.image} name={player.displayName} />
          <PlayerName player={player} />
        </div>
      ))}
    </div>
  )
}

interface TournamentRegistrantsTeamProps {
  teams: PublicTournamentTeamRegistrant[]
}

export const TournamentRegistrantsTeam = ({
  teams,
}: TournamentRegistrantsTeamProps) => {
  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="inline-flex rounded-full bg-white/5 p-4 ring-1 ring-white/10">
          <Users className="size-8 text-zinc-500" />
        </div>
        <p className="text-sm text-zinc-500">
          Aucune équipe inscrite pour le moment
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {teams.map(team => (
        <div
          key={team.teamId}
          className="rounded-xl border border-white/5 bg-white/2 p-4"
        >
          <div className="mb-3 flex items-center gap-3">
            {team.logoUrl ? (
              <Image
                src={team.logoUrl}
                alt={team.teamName}
                width={28}
                height={28}
                className="rounded-lg ring-1 ring-white/10"
              />
            ) : (
              <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-800 ring-1 ring-white/10">
                <Users className="size-3.5 text-zinc-500" />
              </div>
            )}
            <span className="font-semibold text-white">{team.teamName}</span>
            <span className="ml-auto text-xs text-zinc-500">
              {team.members.length} membre{team.members.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {team.members.map(member => (
              <div
                key={member.userId}
                className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/2 px-3 py-1.5"
              >
                <PlayerAvatar
                  image={member.image}
                  name={member.displayName}
                  size={24}
                />
                <PlayerName player={member} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
