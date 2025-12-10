/**
 * File: components/features/landing/features/features.tsx
 * Description: Features section of the landing page.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

"use client"

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { cn } from "@/lib/utils"
import { Variants, motion } from "framer-motion"
import { LucideIcon, Swords, Target, Zap } from "lucide-react"
import { fr } from "@/lib/i18n/dictionaries/fr"

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

interface FeatureItem {
  title: string
  description: string
  icon: LucideIcon
  styles: {
    iconColor: string
    bg: string
    border: string
  }
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------



// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

const FeatureCard = ({
  feature,
  index,
}: { feature: FeatureItem; index: number }) => {
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: index * 0.2, duration: 0.5 },
    },
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-zinc-900/50 p-8 transition-all hover:-translate-y-2 hover:bg-zinc-900",
        feature.styles.border,
      )}
    >
      {/* Icon Container */}
      <div
        className={cn(
          "mb-6 inline-flex rounded-xl p-4 transition-colors group-hover:bg-opacity-20",
          feature.styles.bg,
        )}
      >
        <feature.icon className={cn("size-8", feature.styles.iconColor)} />
      </div>

      {/* Content */}
      <h3 className="mb-3 text-2xl font-bold text-white">{feature.title}</h3>
      <p className="leading-relaxed text-zinc-400">{feature.description}</p>

      {/* Background Glow Effect */}
      <div className="absolute -right-12 -top-12 size-32 rounded-full bg-white/5 blur-3xl transition-all group-hover:bg-white/10" />
    </motion.div>
  )
}

export const FeaturesSection = () => {
  return (
    <section className="container mx-auto px-4">
      {/* Section Header */}
      <div className="mb-16 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-white sm:text-5xl"
        >
          {fr.pages.home.features.title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-lg text-zinc-400"
        >
          {fr.pages.home.features.subtitle}
        </motion.p>
      </div>

      {/* Grid Layout */}
      <div className="grid gap-8 md:grid-cols-3">
        {[
          {
            title: fr.pages.home.features.items.fairPlay.title,
            description: fr.pages.home.features.items.fairPlay.description,
            icon: Swords,
            styles: {
              iconColor: "text-orange-400",
              bg: "bg-orange-400/10",
              border: "border-orange-400/20",
            },
          },
          {
            title: fr.pages.home.features.items.proFormat.title,
            description: fr.pages.home.features.items.proFormat.description,
            icon: Target,
            styles: {
              iconColor: "text-blue-400",
              bg: "bg-blue-400/10",
              border: "border-blue-400/20",
            },
          },
          {
            title: fr.pages.home.features.items.liveStream.title,
            description: fr.pages.home.features.items.liveStream.description,
            icon: Zap,
            styles: {
              iconColor: "text-purple-400",
              bg: "bg-purple-400/10",
              border: "border-purple-400/20",
            },
          },
        ].map((feature, index) => (
          <FeatureCard key={feature.title} feature={feature} index={index} />
        ))}
      </div>
    </section>
  )
}
