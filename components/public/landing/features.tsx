"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Swords, Target, Zap } from "lucide-react";

export function Features() {
  return (
    <section className="container mx-auto px-4">
      <div className="mb-16 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-white sm:text-5xl"
        >
          Pourquoi nous rejoindre ?
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
  );
}
