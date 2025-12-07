/**
 * File: components/layout/landing/stats-section.tsx
 * Description: Stats section of the landing page.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

"use client";

import { motion } from "framer-motion";
import { Calendar, Gamepad2, LucideIcon, Trophy, Users } from "lucide-react";

// Types
export interface StatsData {
    years?: string | null
    players?: string | null
    tournaments?: string | null
    matches?: string | null
}

export interface StatsProps {
    stats: StatsData
}

interface StatConfigItem {
    key: keyof StatsData
    label: string
    icon: LucideIcon
}

// Constants
const DEFAULT_VALUE = '??'

const STATS_CONFIG: StatConfigItem[] = [
    {
        key: 'years',
        label: "Années d'existence",
        icon: Calendar,
    },
    {
        key: 'players',
        label: 'Joueurs Inscrits',
        icon: Users,
    },
    {
        key: 'tournaments',
        label: 'Tournois Organisés',
        icon: Trophy,
    },
    {
        key: 'matches',
        label: 'Matchs Joués',
        icon: Gamepad2,
    },
]

export const StatsSection = ({ stats }: StatsProps) => {
    return (
        <section className="container mx-auto px-4 scroll-mt-24" id="stats">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="grid grid-cols-2 gap-8 rounded-3xl border border-zinc-800 bg-zinc-900/30 p-12 backdrop-blur-sm md:grid-cols-4"
            >
                {STATS_CONFIG.map((item) => {
                    const value = stats[item.key] || DEFAULT_VALUE

                    return (
                        <div
                            key={item.key}
                            className="flex flex-col items-center gap-4 text-center"
                        >
                            <div className="rounded-full bg-blue-500/10 p-4 ring-1 ring-blue-500/20">
                                <item.icon className="size-8 text-blue-400" />
                            </div>

                            <div>
                                <div className="text-4xl font-black text-white">
                                    {value}
                                </div>
                                <div className="mt-1 text-sm font-medium uppercase tracking-wider text-zinc-400">
                                    {item.label}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </motion.div>
        </section>
    )
}
