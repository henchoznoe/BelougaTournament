/**
 * File: app/admin/page.tsx
 * Description: Admin dashboard page displaying summary statistics and recent registrations.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

import {
    Activity,
    ArrowUpRight,
    Calendar,
    Lock,
    Settings,
    Trophy,
    UserCheck,
    Users,
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSession, UserRole } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function getStats() {
    const [
        totalTournaments,
        activeTournaments,
        archivedTournaments,
        totalRegistrations,
        pendingRegistrations,
        approvedRegistrations,
        totalAdmins,
        totalParticipants,
        recentRegistrations,
    ] = await Promise.all([
        prisma.tournament.count(),
        prisma.tournament.count({ where: { isArchived: false } }),
        prisma.tournament.count({ where: { isArchived: true } }),
        prisma.registration.count(),
        prisma.registration.count({ where: { status: 'PENDING' } }),
        prisma.registration.count({ where: { status: 'APPROVED' } }),
        prisma.user.count(),
        prisma.player.count(),
        prisma.registration.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                tournament: true,
                players: true,
            },
        }),
    ])

    return {
        totalTournaments,
        activeTournaments,
        archivedTournaments,
        totalRegistrations,
        pendingRegistrations,
        approvedRegistrations,
        totalAdmins,
        totalParticipants,
        recentRegistrations,
    }
}

export default async function AdminDashboard() {
    const session = await getSession()
    const userRole = session?.user?.role
    const stats = await getStats()

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
                        Tableau de bord
                    </h1>
                    <p className="text-zinc-400">
                        Vue d'ensemble de votre plateforme de tournois.
                    </p>
                </div>
                <Button
                    asChild
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                >
                    <Link href="/admin/tournaments/new">
                        <Trophy className="mr-2 h-5 w-5" />
                        Créer un Tournoi
                    </Link>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            Tournois Actifs
                        </CardTitle>
                        <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Trophy className="size-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {stats.activeTournaments}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            Sur {stats.totalTournaments} tournois au total
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            Inscriptions en attente
                        </CardTitle>
                        <div className="size-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                            <Users className="size-4 text-yellow-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {stats.pendingRegistrations}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            <span className="text-green-500 font-medium">
                                {stats.approvedRegistrations}
                            </span>{' '}
                            Approuvées
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            Total Participants
                        </CardTitle>
                        <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <UserCheck className="size-4 text-emerald-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {stats.totalParticipants}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            Joueurs uniques
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            Total Administrateurs
                        </CardTitle>
                        <div className="size-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Activity className="size-4 text-purple-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {stats.totalAdmins}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            Gestionnaires du site
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Registrations & Quick Actions */}
            <div className="grid gap-6 md:grid-cols-7">
                <Card className="col-span-4 border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                            <Activity className="size-5 text-blue-500" />
                            Activité Récente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.recentRegistrations.length > 0 ? (
                            <div className="space-y-4">
                                {stats.recentRegistrations.map(reg => (
                                    <div
                                        key={reg.id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                                                {(
                                                    reg.teamName ||
                                                    reg.players[0]?.nickname ||
                                                    '?'
                                                )
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-white">
                                                        {reg.teamName ||
                                                            reg.players[0]
                                                                ?.nickname ||
                                                            'Inconnu'}
                                                    </p>
                                                    <Badge
                                                        variant={
                                                            reg.status ===
                                                            'APPROVED'
                                                                ? 'default'
                                                                : reg.status ===
                                                                    'PENDING'
                                                                  ? 'secondary'
                                                                  : 'destructive'
                                                        }
                                                        className="text-[10px] h-5 px-1.5"
                                                    >
                                                        {reg.status ===
                                                        'APPROVED'
                                                            ? 'APPROUVÉ'
                                                            : reg.status ===
                                                                'PENDING'
                                                              ? 'EN ATTENTE'
                                                              : 'REFUSÉ'}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-zinc-400 flex items-center gap-1">
                                                    Inscrit au tournoi
                                                    <span className="text-blue-400 font-medium">
                                                        {reg.tournament.title}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-xs text-zinc-500 flex flex-col items-end gap-1">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="size-3" />
                                                {new Date(
                                                    reg.createdAt,
                                                ).toLocaleDateString('fr-FR')}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-[10px] text-zinc-400 hover:text-white px-2 hover:bg-white/10"
                                                asChild
                                            >
                                                <Link
                                                    href={`/admin/tournaments/${reg.tournamentId}`}
                                                >
                                                    Voir
                                                    <ArrowUpRight className="ml-1 size-3" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-zinc-500 flex flex-col items-center gap-2">
                                <Activity className="size-8 opacity-20" />
                                <p>Aucune activité récente.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3 border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                            <Trophy className="size-5 text-yellow-500" />
                            Actions Rapides
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* Manage Tournaments - Available to All */}
                        <Button
                            variant="outline"
                            className="w-full h-16 justify-start border-white/5 bg-white/5 hover:bg-white/10 hover:text-white text-zinc-300 hover:border-blue-500/30 group relative overflow-hidden"
                            asChild
                        >
                            <Link href="/admin/tournaments">
                                <div className="size-10 rounded bg-blue-500/10 flex items-center justify-center mr-4 group-hover:bg-blue-500/20 transition-colors">
                                    <Trophy className="size-5 text-blue-500" />
                                </div>
                                <div className="flex flex-col items-start z-10">
                                    <span className="font-medium text-base">
                                        Gérer les Tournois
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                        Créer, modifier et gérer
                                    </span>
                                </div>
                            </Link>
                        </Button>

                        {/* Manage Admins - SuperAdmin Only */}
                        {userRole === UserRole.SUPERADMIN ? (
                            <Button
                                variant="outline"
                                className="w-full h-16 justify-start border-white/5 bg-white/5 hover:bg-white/10 hover:text-white text-zinc-300 hover:border-purple-500/30 group"
                                asChild
                            >
                                <Link href="/admin/admins">
                                    <div className="size-10 rounded bg-purple-500/10 flex items-center justify-center mr-4 group-hover:bg-purple-500/20 transition-colors">
                                        <Users className="size-5 text-purple-500" />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium text-base">
                                            Gérer les Admins
                                        </span>
                                        <span className="text-xs text-zinc-500">
                                            Comptes et accès
                                        </span>
                                    </div>
                                </Link>
                            </Button>
                        ) : (
                            <div className="relative group cursor-not-allowed">
                                <Button
                                    variant="outline"
                                    className="w-full h-16 justify-start border-white/5 bg-zinc-900/20 text-zinc-600 opacity-50 cursor-not-allowed"
                                    disabled
                                >
                                    <div className="size-10 rounded bg-zinc-800/50 flex items-center justify-center mr-4">
                                        <Lock className="size-5 text-zinc-600" />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium text-base">
                                            Gérer les Admins
                                        </span>
                                        <span className="text-xs text-zinc-600">
                                            Réservé aux SuperAdmins
                                        </span>
                                    </div>
                                </Button>
                            </div>
                        )}

                        {/* Settings - SuperAdmin Only */}
                        {userRole === UserRole.SUPERADMIN ? (
                            <Button
                                variant="outline"
                                className="w-full h-16 justify-start border-white/5 bg-white/5 hover:bg-white/10 hover:text-white text-zinc-300 hover:border-zinc-500/30 group"
                                asChild
                            >
                                <Link href="/admin/settings">
                                    <div className="size-10 rounded bg-zinc-500/10 flex items-center justify-center mr-4 group-hover:bg-zinc-500/20 transition-colors">
                                        <Settings className="size-5 text-zinc-400" />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium text-base">
                                            Paramètres du Site
                                        </span>
                                        <span className="text-xs text-zinc-500">
                                            Configuration globale
                                        </span>
                                    </div>
                                </Link>
                            </Button>
                        ) : (
                            <div className="relative group cursor-not-allowed">
                                <Button
                                    variant="outline"
                                    className="w-full h-16 justify-start border-white/5 bg-zinc-900/20 text-zinc-600 opacity-50 cursor-not-allowed"
                                    disabled
                                >
                                    <div className="size-10 rounded bg-zinc-800/50 flex items-center justify-center mr-4">
                                        <Lock className="size-5 text-zinc-600" />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium text-base">
                                            Paramètres du Site
                                        </span>
                                        <span className="text-xs text-zinc-600">
                                            Réservé aux SuperAdmins
                                        </span>
                                    </div>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
