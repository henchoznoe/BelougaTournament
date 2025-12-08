/**
 * File: components/features/tournament/list/tournaments-list.tsx
 * Description: Tournaments list section of the landing page.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

"use client"

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import { Calendar, ChevronLeft, ChevronRight, Gamepad2, Users } from "lucide-react"
import { useRef } from "react"
import { fr } from "@/lib/i18n/dictionaries/fr"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDateTime } from '@/lib/utils'
import { APP_ROUTES } from "@/lib/config/routes"

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

export interface Tournament {
  id: string
  title: string
  description: string
  slug: string
  startDate: Date | string
  format: string
  maxParticipants: number | null
}

interface TournamentsListProps {
  tournaments: Tournament[]
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------


// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const getParticipantLabel = (count: number | null, format: string): string => {
  if (!count) return fr.components.tournamentsList.labelOpen
  const type = format === "TEAM" ? "Équipes" : "Joueurs"
  return `Max ${count} ${type}`
}

const TournamentCard = ({ tournament }: { tournament: Tournament }) => {
  return (
    <Card className="group h-full border-zinc-800 bg-zinc-900/80 transition-all hover:border-blue-500/50 hover:shadow-[0_0_30px_-10px_rgba(37,99,235,0.3)]">
      <CardHeader>
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20">
            {tournament.format}
          </span>
          <span className="font-mono text-xs text-zinc-500">
            ID: {tournament.slug.slice(0, 8)}
          </span>
        </div>
        <CardTitle className="text-2xl text-white transition-colors group-hover:text-blue-400">
          {tournament.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-zinc-400">
          {tournament.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 text-sm text-zinc-300">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-800">
            <Calendar className="size-4 text-blue-500" />
          </div>
          <span className="font-medium capitalize">
            {formatDateTime(tournament.startDate)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-800">
            <Users className="size-4 text-green-500" />
          </div>
          <span>
            {getParticipantLabel(tournament.maxParticipants, tournament.format)}
          </span>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          asChild
          className="w-full bg-zinc-800 font-semibold text-white transition-colors hover:bg-blue-600"
        >
          <Link href={`${APP_ROUTES.TOURNAMENTS}/${tournament.slug}`}>
            {fr.components.tournamentsList.labelDetails}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

const EmptyState = () => {
  return (
    <div className="col-span-full py-12 text-center">
      <Calendar className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">
        {fr.components.tournamentsList.emptyTitle}
      </h3>
      <p className="text-zinc-500">{fr.components.tournamentsList.emptyDesc}</p>
    </div>
  )
}

export const TournamentsList = ({ tournaments }: TournamentsListProps) => {
  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
  }

  return (
    <section className="container mx-auto px-4" id="tournaments">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white sm:text-4xl"
          >
            {fr.components.tournamentsList.sectionTitle}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-2 h-1 w-20 rounded-full bg-blue-500"
          />
        </div>

        <Button
          asChild
          variant="ghost"
          className="pr-0 text-zinc-400 transition-all hover:bg-white/5 hover:pr-4 hover:text-white"
        >
          <Link href={APP_ROUTES.TOURNAMENTS}>
            {fr.components.tournamentsList.viewAll} <ChevronRight className="mr-2 size-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tournaments.length > 0 ? (
          tournaments.map((tournament, index) => (
            <motion.div
              key={tournament.id}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <TournamentCard tournament={tournament} />
            </motion.div>
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  )
}
