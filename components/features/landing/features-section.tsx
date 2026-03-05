/**
 * File: components/features/landing/features-section.tsx
 * Description: Features section of the landing page.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { type LucideIcon, Swords, Target, Zap } from 'lucide-react'
import { getGlobalSettings } from '@/lib/services/settings'
import { cn } from '@/lib/utils/cn'

interface FeatureItem {
  title: string
  description: string
  icon: LucideIcon
  styles: {
    iconColor: string
    bg: string
    border: string
    glow: string
  }
}

/** Hardcoded defaults used when the DB value is null or empty. */
const FEATURE_DEFAULTS = [
  {
    title: 'Matchmaking Équitable',
    description:
      'Affrontez des joueurs de votre niveau grâce à notre système de rangs strict. Pas de smurfs, juste du pur talent.',
    icon: Swords,
    styles: {
      iconColor: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'group-hover:border-orange-500/50',
      glow: 'group-hover:bg-orange-500/10',
    },
  },
  {
    title: 'Format Compétitif',
    description:
      'Arbre de tournoi professionnel, phases de poules et playoffs. Vivez la pression des grandes ligues e-sport.',
    icon: Target,
    styles: {
      iconColor: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'group-hover:border-blue-500/50',
      glow: 'group-hover:bg-blue-500/10',
    },
  },
  {
    title: 'Diffusion en Direct',
    description:
      'Les phases finales sont commentées et diffusées sur notre chaîne Twitch. Montrez votre talent à toute la communauté.',
    icon: Zap,
    styles: {
      iconColor: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'group-hover:border-purple-500/50',
      glow: 'group-hover:bg-purple-500/10',
    },
  },
] as const

const FeatureCard = ({ feature }: { feature: FeatureItem }) => {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/5 bg-white/2 p-8 transition-all duration-300 backdrop-blur-md',
        'hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]',
        feature.styles.border,
      )}
    >
      {/* Background Hover Glow */}
      <div
        className={cn(
          'absolute inset-0 z-0 opacity-0 transition-opacity duration-500',
          feature.styles.glow,
        )}
      />

      {/* Internal Content */}
      <div className="relative z-10">
        {/* Icon Container */}
        <div
          className={cn(
            'mb-6 inline-flex rounded-xl p-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]',
            feature.styles.bg,
          )}
        >
          <feature.icon className={cn('size-8', feature.styles.iconColor)} />
        </div>

        {/* Content */}
        <h3 className="mb-3 font-paladins text-xl tracking-wider text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
          {feature.title}
        </h3>
        <p className="leading-relaxed text-zinc-400 transition-colors duration-300 group-hover:text-zinc-300">
          {feature.description}
        </p>
      </div>

      {/* Decorative Blob */}
      <div
        className={cn(
          'absolute -right-12 -top-12 z-0 size-32 opacity-20 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-40 rounded-full',
          feature.styles.bg,
        )}
      />
    </div>
  )
}

export const FeaturesSection = async () => {
  const settings = await getGlobalSettings()

  const features: FeatureItem[] = [
    {
      title: settings.feature1Title || FEATURE_DEFAULTS[0].title,
      description:
        settings.feature1Description || FEATURE_DEFAULTS[0].description,
      icon: FEATURE_DEFAULTS[0].icon,
      styles: FEATURE_DEFAULTS[0].styles,
    },
    {
      title: settings.feature2Title || FEATURE_DEFAULTS[1].title,
      description:
        settings.feature2Description || FEATURE_DEFAULTS[1].description,
      icon: FEATURE_DEFAULTS[1].icon,
      styles: FEATURE_DEFAULTS[1].styles,
    },
    {
      title: settings.feature3Title || FEATURE_DEFAULTS[2].title,
      description:
        settings.feature3Description || FEATURE_DEFAULTS[2].description,
      icon: FEATURE_DEFAULTS[2].icon,
      styles: FEATURE_DEFAULTS[2].styles,
    },
  ]

  return (
    <section className="relative container mx-auto px-4 py-24">
      {/* Decorative Top Line */}
      <div className="absolute left-1/2 top-0 -z-10 h-px w-1/2 -translate-x-1/2 bg-linear-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />

      {/* Section Header */}
      <div className="mb-20 text-center">
        <div className="mx-auto mb-6 inline-flex items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5">
          <span className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            Pourquoi nous rejoindre ?
          </span>
        </div>

        <h2 className="font-paladins text-4xl tracking-wider text-white sm:text-5xl lg:text-6xl drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] uppercase">
          L'arène ultime
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          Expérimentez la compétition à son paroxysme. Des tournois conçus par
          des joueurs, pour des joueurs.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3 md:gap-8">
        {features.map(feature => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>
    </section>
  )
}
