/**
 * File: components/public/landing/how-it-works-section.tsx
 * Description: Three-step "how it works" section guiding visitors towards registration.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { LogIn, type LucideIcon, Swords, Trophy } from 'lucide-react'
import { GlowCard } from '@/components/public/shared/glow-card'
import { Reveal } from '@/components/public/shared/reveal'
import { SectionHeader } from '@/components/public/shared/section-header'

interface Step {
  number: string
  title: string
  description: string
  icon: LucideIcon
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Connecte-toi',
    description:
      'Crée ton compte en un clic avec Discord. Pas de mot de passe à retenir, tu es prêt en quelques secondes.',
    icon: LogIn,
  },
  {
    number: '02',
    title: 'Inscris-toi',
    description:
      'Choisis un tournoi, en solo ou en équipe, remplis ta fiche et valide ta place dans la grille.',
    icon: Swords,
  },
  {
    number: '03',
    title: 'Affronte & brille',
    description:
      'Grimpe le bracket, vis la pression des phases finales et montre ton talent en direct sur Twitch.',
    icon: Trophy,
  },
]

export const HowItWorksSection = () => {
  return (
    <section className="relative container mx-auto px-4 py-24">
      <SectionHeader
        eyebrow="Comment ça marche"
        title="Prêt en 3 étapes"
        description="De l'inscription à la grande finale, on a pensé chaque étape pour que tu puisses te concentrer sur le jeu."
        className="mb-20"
      />

      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3 md:gap-8">
        {STEPS.map((step, index) => (
          <Reveal key={step.number} delay={index * 0.1}>
            <GlowCard className="h-full p-8">
              <div className="mb-6 flex items-center justify-between">
                <span className="inline-flex rounded-xl border border-brand/20 bg-brand/10 p-3.5">
                  <step.icon className="size-7 text-brand" />
                </span>
                <span className="font-paladins text-5xl tracking-wider text-white/10">
                  {step.number}
                </span>
              </div>
              <h3 className="mb-3 font-paladins text-xl uppercase tracking-wider text-white">
                {step.title}
              </h3>
              <p className="leading-relaxed text-zinc-400">
                {step.description}
              </p>
            </GlowCard>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
