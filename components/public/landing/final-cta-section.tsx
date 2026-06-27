/**
 * File: components/public/landing/final-cta-section.tsx
 * Description: Closing call-to-action band that drives visitors to register or browse.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Reveal } from '@/components/public/shared/reveal'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/config/routes'

interface FinalCtaSectionProps {
  isAuthenticated: boolean
}

export const FinalCtaSection = ({ isAuthenticated }: FinalCtaSectionProps) => {
  return (
    <section className="container mx-auto px-4 py-24">
      <Reveal>
        <div className="glass relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-12 sm:py-20">
          {/* Brand halo */}
          <div className="pointer-events-none absolute left-1/2 top-0 size-[36rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/15 blur-[120px]" />

          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="font-paladins text-4xl uppercase tracking-wider text-white drop-shadow-[0_0_20px_rgba(59,130,246,0.3)] sm:text-5xl">
              Prêt à entrer dans l'arène ?
            </h2>
            <p className="mt-5 text-lg text-zinc-400">
              Rejoins la communauté, décroche ta place et fais-toi un nom sur la
              scène compétitive Belouga.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button
                asChild
                variant="brand"
                size="lg"
                className="group h-14 px-8 text-lg"
              >
                <Link href={ROUTES.TOURNAMENTS}>
                  Voir les tournois
                  <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              {!isAuthenticated && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-14 border-white/10 bg-white/5 px-8 text-lg font-medium text-white backdrop-blur-md transition-all hover:border-brand/50 hover:bg-white/10 hover:text-brand"
                >
                  <Link href={ROUTES.LOGIN}>Créer mon compte</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
