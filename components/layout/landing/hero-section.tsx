/**
 * File: components/layout/landing/hero-section.tsx
 * Description: Main hero section of the landing page.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

"use client";

import { Button } from "@/components/ui/button";
import { motion, Variants } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Constants
const ASSETS = {
  BACKGROUND_IMAGE: "/assets/wall.png",
} as const

const ROUTES = {
  TOURNAMENTS: "/tournaments",
  STATS_ANCHOR: "#stats",
} as const

const HERO_CONTENT = {
  BADGE: "🚀 La référence des tournois amateurs",
  TITLE_MAIN: "BELOUGA",
  TITLE_GRADIENT: "TOURNAMENT",
  DESCRIPTION_BODY: "Plongez dans l'arène ultime. Rejoignez une communauté passionnée, prouvez votre valeur et gravez votre nom dans la légende.",
  DESCRIPTION_HIGHLIGHT: "Votre gloire commence ici.",
  CTA_PRIMARY: "Participer",
  CTA_SECONDARY: "En savoir plus",
} as const

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export const HeroSection = () => {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4 text-center">

      {/* Background Layer */}
      <div className="absolute inset-0 z-0 select-none">
        <Image
          alt="Belouga Tournament Arena Background"
          src={ASSETS.BACKGROUND_IMAGE}
          fill
          priority
          className="object-cover opacity-50"
          sizes="100vw"
        />
        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-linear-to-b from-zinc-950/80 via-zinc-950/50 to-zinc-950" />
      </div>

      {/* Content Container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl space-y-8"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400 backdrop-blur-sm">
            {HERO_CONTENT.BADGE}
          </span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          variants={itemVariants}
          className="text-6xl font-black tracking-tighter text-white drop-shadow-2xl sm:text-8xl lg:text-9xl"
        >
          {HERO_CONTENT.TITLE_MAIN}{" "}
          <span className="animate-gradient-x bg-linear-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            {HERO_CONTENT.TITLE_GRADIENT}
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="mx-auto max-w-2xl text-lg font-medium leading-relaxed text-zinc-300 sm:text-xl"
        >
          {HERO_CONTENT.DESCRIPTION_BODY}
          <br />
          <span className="text-blue-400">
            {HERO_CONTENT.DESCRIPTION_HIGHLIGHT}
          </span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap justify-center gap-6 pt-4"
        >
          <Button
            asChild
            size="lg"
            className="h-14 bg-blue-600 px-8 text-lg font-bold shadow-[0_0_30px_-10px_rgba(37,99,235,0.5)] transition-all hover:scale-105 hover:bg-blue-500 hover:shadow-[0_0_40px_-10px_rgba(37,99,235,0.7)]"
          >
            <Link href={ROUTES.TOURNAMENTS}>
              {HERO_CONTENT.CTA_PRIMARY}
              <ChevronRight className="ml-2 size-5" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-14 border-zinc-700 bg-zinc-950/50 px-8 text-lg text-white backdrop-blur transition-all hover:border-blue-500/50 hover:bg-zinc-900 hover:text-blue-400"
          >
            <Link href={ROUTES.STATS_ANCHOR}>
              {HERO_CONTENT.CTA_SECONDARY}
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
