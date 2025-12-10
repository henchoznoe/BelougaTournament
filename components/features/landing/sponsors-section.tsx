/**
 * File: components/features/landing/sponsors-section.tsx
 * Description: Sponsors section displaying main partners of the tournament.
 * Author: Noé Henchoz
 * Date: 2025-12-08
 * License: MIT
 */

"use client"

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { cn } from "@/lib/utils"
import { Variants, motion } from "framer-motion"
import { Crown, Gem, Handshake, LucideIcon } from "lucide-react"
import { fr } from "@/lib/i18n/dictionaries/fr"

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

interface SponsorItem {
  id: string
  name: string
  tier: "PLATINUM" | "GOLD" | "SILVER"
  description?: string
  icon: LucideIcon
  styles: {
    iconColor: string
    bg: string
    border: string
    glow: string
  }
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------



// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const SponsorCard = ({
  sponsor,
  index,
}: { sponsor: SponsorItem; index: number }) => {
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: index * 0.1, duration: 0.5 },
    },
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={cn(
        "group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border bg-zinc-900/50 p-6 text-center transition-all hover:-translate-y-1 hover:bg-zinc-900",
        sponsor.styles.border,
      )}
    >
      {/* Icon / Logo Area */}
      <div
        className={cn(
          "mb-4 inline-flex items-center justify-center rounded-full p-4 transition-colors duration-300",
          sponsor.styles.bg,
        )}
      >
        <sponsor.icon className={cn("size-8", sponsor.styles.iconColor)} />
      </div>

      {/* Content */}
      <h3 className="mb-2 text-xl font-bold text-white">{sponsor.name}</h3>
      {sponsor.description && (
        <p className="text-sm text-zinc-400">{sponsor.description}</p>
      )}

      {/* Hover Glow */}
      <div
        className={cn(
          "absolute -right-8 -top-8 size-24 rounded-full blur-2xl transition-all duration-500 group-hover:bg-opacity-30",
          sponsor.styles.glow,
          "opacity-0 group-hover:opacity-100",
        )}
      />
    </motion.div>
  )
}

export const SponsorsSection = () => {
  return (
    <section className="container mx-auto px-4">
      {/* Section Header */}
      <div className="mb-12 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-white sm:text-5xl"
        >
          {fr.pages.home.sponsors.title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-lg text-zinc-400"
        >
          {fr.pages.home.sponsors.subtitle}
        </motion.p>
      </div>

      {/* Grid Layout - Responsive: 1 col mobile, 3 cols desktop */}
      <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 md:grid-cols-3">
        {[
          {
            id: "sponsor-1",
            name: fr.pages.home.sponsors.partners.platinum.name,
            tier: "PLATINUM",
            description: fr.pages.home.sponsors.partners.platinum.description,
            icon: Crown,
            styles: {
              iconColor: "text-amber-400",
              bg: "bg-amber-400/10",
              border: "border-amber-400/20",
              glow: "bg-amber-400/20",
            },
          } as SponsorItem,
          {
            id: "sponsor-2",
            name: fr.pages.home.sponsors.partners.gold.name,
            tier: "GOLD",
            description: fr.pages.home.sponsors.partners.gold.description,
            icon: Gem,
            styles: {
              iconColor: "text-blue-400",
              bg: "bg-blue-400/10",
              border: "border-blue-400/20",
              glow: "bg-blue-400/20",
            },
          } as SponsorItem,
          {
            id: "sponsor-3",
            name: fr.pages.home.sponsors.partners.silver.name,
            tier: "SILVER",
            description: fr.pages.home.sponsors.partners.silver.description,
            icon: Handshake,
            styles: {
              iconColor: "text-emerald-400",
              bg: "bg-emerald-400/10",
              border: "border-emerald-400/20",
              glow: "bg-emerald-400/20",
            },
          } as SponsorItem,
        ].map((sponsor, index) => (
          <SponsorCard key={sponsor.id} sponsor={sponsor} index={index} />
        ))}
      </div>

       {/* Call to action for potential sponsors (Optional but nice) */}
       <motion.div
         initial={{ opacity: 0 }}
         whileInView={{ opacity: 1 }}
         viewport={{ once: true }}
         transition={{ delay: 0.6 }}
         className="mt-12 text-center"
        >
          <p className="text-sm text-zinc-500">
            {fr.pages.home.sponsors.cta.text} <span className="text-zinc-300 hover:text-white cursor-pointer underline underline-offset-4 transition-colors">{fr.pages.home.sponsors.cta.link}</span>
          </p>
       </motion.div>
    </section>
  )
}
