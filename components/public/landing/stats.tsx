"use client";

import { motion } from "framer-motion";
import { Calendar, Gamepad2, Trophy, Users } from "lucide-react";

export interface StatsProps {
    stats: {
        years?: string | null
        players?: string | null
        tournaments?: string | null
        matches?: string | null
    }
}

export function Stats({ stats }: StatsProps) {
    return (
        <section className="container mx-auto px-4">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="grid grid-cols-2 gap-8 rounded-3xl border border-zinc-800 bg-zinc-900/30 p-12 backdrop-blur-sm md:grid-cols-4"
            >
                {[
                    {
                        label: "Années d'existence",
                        value: stats.years || '??',
                        icon: Calendar,
                    },
                    {
                        label: 'Joueurs Inscrits',
                        value: stats.players || '??',
                        icon: Users,
                    },
                    {
                        label: 'Tournois Organisés',
                        value: stats.tournaments || '??',
                        icon: Trophy,
                    },
                    {
                        label: 'Matchs Joués',
                        value: stats.matches || '??',
                        icon: Gamepad2,
                    },
                ].map((stat, index) => (
                    <div
                        key={index}
                        className="flex flex-col items-center gap-4 text-center"
                    >
                        <div className="rounded-full bg-blue-500/10 p-4 ring-1 ring-blue-500/20">
                            <stat.icon className="size-8 text-blue-400" />
                        </div>
                        <div>
                            <div className="text-4xl font-black text-white">
                                {stat.value}
                            </div>
                            <div className="text-sm font-medium text-zinc-400 uppercase tracking-wider mt-1">
                                {stat.label}
                            </div>
                        </div>
                    </div>
                ))}
            </motion.div>
        </section>
    )
}
