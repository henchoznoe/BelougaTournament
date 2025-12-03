"use client";

import { TwitchEmbed } from "@/components/twitch-embed";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Calendar,
  ChevronRight,
  Gamepad2,
  Swords,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
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

interface LandingContentProps {
  tournaments: Tournament[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function LandingContent({ tournaments }: LandingContentProps) {
  const featuredTournament = tournaments[0];

  return (
    <div className="flex flex-col gap-24 pb-24 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 text-center">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <Image
            alt="Belouga Background"
            className="object-cover opacity-40"
            fill
            priority
            src="/assets/wall.png"
          />
          <div className="absolute inset-0 bg-linear-to-b from-zinc-950/80 via-zinc-950/50 to-zinc-950" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center mask-[linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-5xl space-y-8"
        >
          <motion.div variants={itemVariants} className="flex justify-center">
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400 backdrop-blur-sm">
              🚀 La référence des tournois amateurs
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-6xl font-black tracking-tighter text-white sm:text-8xl lg:text-9xl drop-shadow-2xl"
          >
            BELOUGA{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-indigo-500 to-purple-600 animate-gradient-x">
              TOURNAMENT
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto max-w-2xl text-lg text-zinc-300 sm:text-xl font-medium leading-relaxed"
          >
            Plongez dans l'arène ultime. Rejoignez une communauté passionnée,
            prouvez votre valeur et gravez votre nom dans la légende.
            <br />
            <span className="text-blue-400">
              Votre gloire commence ici.
            </span>
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-6 pt-4"
          >
            {featuredTournament ? (
              <Button
                asChild
                className="h-14 px-8 text-lg font-bold bg-blue-600 hover:bg-blue-500 shadow-[0_0_30px_-10px_rgba(37,99,235,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(37,99,235,0.7)]"
                size="lg"
              >
                <Link href={`/tournaments/${featuredTournament.slug}`}>
                  S'inscrire au prochain tournoi
                  <ChevronRight className="ml-2 size-5" />
                </Link>
              </Button>
            ) : (
              <Button
                className="h-14 px-8 text-lg bg-zinc-800/50 backdrop-blur border border-zinc-700 text-zinc-400 cursor-not-allowed"
                disabled
                size="lg"
              >
                Aucun tournoi en cours
              </Button>
            )}
            <Button
              asChild
              className="h-14 px-8 text-lg border-zinc-700 bg-zinc-950/50 backdrop-blur hover:bg-zinc-900 text-white hover:text-blue-400 transition-all hover:border-blue-500/50"
              size="lg"
              variant="outline"
            >
              <Link href="#tournaments">Voir tous les tournois</Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-2 gap-8 rounded-3xl border border-zinc-800 bg-zinc-900/30 p-12 backdrop-blur-sm md:grid-cols-4"
        >
          {[
            { label: "Années d'existence", value: "2+", icon: Calendar },
            { label: "Joueurs Inscrits", value: "500+", icon: Users },
            { label: "Tournois Organisés", value: "50+", icon: Trophy },
            { label: "Matchs Joués", value: "1.2k+", icon: Gamepad2 },
          ].map((stat, index) => (
            <div key={index} className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-blue-500/10 p-4 ring-1 ring-blue-500/20">
                <stat.icon className="size-8 text-blue-400" />
              </div>
              <div>
                <div className="text-4xl font-black text-white">{stat.value}</div>
                <div className="text-sm font-medium text-zinc-400 uppercase tracking-wider mt-1">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white sm:text-5xl"
          >
            Pourquoi nous choisir ?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-zinc-400"
          >
            Une expérience compétitive conçue par des joueurs, pour des joueurs.
          </motion.p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Compétition Fair-play",
              description:
                "Un règlement strict et une modération active pour garantir des parties saines et équitables.",
              icon: Swords,
              color: "text-orange-400",
              bg: "bg-orange-400/10",
              border: "border-orange-400/20",
            },
            {
              title: "Format Professionnel",
              description:
                "Des arbres de tournois clairs, des horaires respectés et une organisation sans faille.",
              icon: Target,
              color: "text-blue-400",
              bg: "bg-blue-400/10",
              border: "border-blue-400/20",
            },
            {
              title: "Diffusion Live",
              description:
                "Vos exploits commentés en direct sur Twitch pour une expérience e-sport immersive.",
              icon: Zap,
              color: "text-purple-400",
              bg: "bg-purple-400/10",
              border: "border-purple-400/20",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-zinc-900/50 p-8 transition-all hover:-translate-y-2 hover:bg-zinc-900",
                feature.border
              )}
            >
              <div
                className={cn(
                  "mb-6 inline-flex rounded-xl p-4 transition-colors group-hover:bg-opacity-20",
                  feature.bg
                )}
              >
                <feature.icon className={cn("size-8", feature.color)} />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-white">
                {feature.title}
              </h3>
              <p className="text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
              <div className="absolute -right-12 -top-12 size-32 rounded-full bg-white/5 blur-3xl transition-all group-hover:bg-white/10" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tournaments Grid */}
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
          <Button asChild variant="ghost" className="text-zinc-400 hover:text-white">
            <Link href="/tournaments">Tout voir <ChevronRight className="ml-2 size-4" /></Link>
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
              <p className="text-zinc-500 mt-2">Revenez plus tard pour les prochaines annonces !</p>
            </div>
          )}
        </div>
      </section>

      {/* Stream Section */}
      <section className="container mx-auto px-4" id="stream">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-1 backdrop-blur-xl">
          <div className="rounded-[20px] bg-zinc-950 p-8 md:p-12">
            <div className="mb-12 flex flex-col items-center text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-500 animate-pulse">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex size-2 rounded-full bg-red-500"></span>
                </span>
                EN DIRECT
              </div>
              <h2 className="mb-4 text-3xl font-bold text-white sm:text-5xl">
                Suivez l'action
              </h2>
              <p className="max-w-xl text-lg text-zinc-400">
                Ne manquez aucun moment fort. Retrouvez les meilleurs matchs commentés en direct sur notre chaîne Twitch.
              </p>
            </div>

            <div className="mx-auto max-w-5xl overflow-hidden rounded-xl shadow-[0_0_50px_-10px_rgba(147,51,234,0.3)] ring-1 ring-white/10">
              <TwitchEmbed channel="quentadoulive" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
