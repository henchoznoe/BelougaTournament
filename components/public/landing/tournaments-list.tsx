"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, Gamepad2, Users } from "lucide-react";
import Link from "next/link";

interface Tournament {
  id: string;
  title: string;
  description: string;
  slug: string;
  startDate: Date;
  format: string;
  maxParticipants: number | null;
}

interface TournamentsListProps {
  tournaments: Tournament[];
}

export function TournamentsList({ tournaments }: TournamentsListProps) {
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
            Tournois à venir
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
          className="mb-8 text-zinc-400 hover:bg-white/5 hover:text-white pl-0 hover:pl-4 transition-all"
        >
          <Link href="/tournaments">
            Tout voir <ChevronLeft className="mr-2 size-4 rotate-180" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tournaments.length > 0 ? (
          tournaments.map((tournament, index) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group h-full border-zinc-800 bg-zinc-900/80 transition-all hover:border-blue-500/50 hover:shadow-[0_0_30px_-10px_rgba(37,99,235,0.3)]">
                <CardHeader>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20">
                      {tournament.format}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      ID: {tournament.slug.slice(0, 8)}
                    </span>
                  </div>
                  <CardTitle className="text-2xl text-white group-hover:text-blue-400 transition-colors">
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
                    <span className="font-medium">
                      {new Date(tournament.startDate).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-800">
                      <Users className="size-4 text-green-500" />
                    </div>
                    <span>
                      {tournament.maxParticipants
                        ? `Max ${tournament.maxParticipants} ${
                            tournament.format === "TEAM" ? "Équipes" : "Joueurs"
                          }`
                        : "Inscriptions ouvertes"}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    asChild
                    className="w-full bg-zinc-800 font-semibold text-white hover:bg-blue-600 transition-colors"
                  >
                    <Link href={`/tournaments/${tournament.slug}`}>
                      Voir les détails
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-zinc-900">
              <Gamepad2 className="size-8 text-zinc-600" />
            </div>
            <h3 className="text-xl font-medium text-white">Aucun tournoi prévu</h3>
            <p className="text-zinc-500 mt-2">
              Revenez plus tard pour les prochaines annonces !
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
