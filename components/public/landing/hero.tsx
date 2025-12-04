"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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

export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 text-center">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <Image
          alt="Belouga Background"
          className="object-cover opacity-50"
          fill
          priority
          src="/assets/wall.png"
        />
        <div className="absolute inset-0 bg-linear-to-b from-zinc-950/80 via-zinc-950/50 to-zinc-950" />
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
          <Button
            asChild
            className="h-14 px-8 text-lg font-bold bg-blue-600 hover:bg-blue-500 shadow-[0_0_30px_-10px_rgba(37,99,235,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(37,99,235,0.7)]"
            size="lg"
          >
            <Link href="/tournaments">
              Participer au tournoi
              <ChevronRight className="ml-2 size-5" />
            </Link>
          </Button>
          <Button
            asChild
            className="h-14 px-8 text-lg border-zinc-700 bg-zinc-950/50 backdrop-blur hover:bg-zinc-900 text-white hover:text-blue-400 transition-all hover:border-blue-500/50"
            size="lg"
            variant="outline"
          >
            <Link href="/tournaments">Les tournois</Link>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
