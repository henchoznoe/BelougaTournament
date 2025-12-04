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
    Settings,
    Trophy,
    UserCheck,
    Users,
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'

async function getStats() {
    const [
        totalTournaments,
        activeTournaments,
        archivedTournaments,
        totalRegistrations,
        pendingRegistrations,
        approvedRegistrations,
        totalUsers,
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
        totalUsers,
        totalParticipants,
        recentRegistrations,
    }
}

export default async function AdminDashboard() {
    const stats = await getStats()

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
                        Dashboard
                    </h1>
                    <p className="text-zinc-400">
                        Overview of your tournament platform.
                    </p>
                </div>
                <Button
                    asChild
                    size="lg"
                    className="shadow-lg shadow-blue-500/20"
                >
                    <Link href="/admin/tournaments/new">
                        <Trophy className="mr-2 h-5 w-5" />
                        Create Tournament
                    </Link>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-sm hover:bg-zinc-900/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            Total Tournaments
                        </CardTitle>
                        <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Trophy className="size-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {stats.totalTournaments}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            <span className="text-blue-400 font-medium">
                                {stats.activeTournaments}
                            </span>{' '}
                            Active
                            <span className="mx-1">•</span>
                            <span className="text-zinc-400">
                                {stats.archivedTournaments}
                            </span>{' '}
                            Archived
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-sm hover:bg-zinc-900/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            Registrations
                        </CardTitle>
                        <div className="size-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Users className="size-4 text-purple-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {stats.totalRegistrations}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            <span className="text-yellow-500 font-medium">
                                {stats.pendingRegistrations}
                            </span>{' '}
                            Pending
                            <span className="mx-1">•</span>
                            <span className="text-green-500 font-medium">
                                {stats.approvedRegistrations}
                            </span>{' '}
                            Approved
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-sm hover:bg-zinc-900/50 transition-colors">
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
                            Unique players across all events
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-sm hover:bg-zinc-900/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            System Users
                        </CardTitle>
                        <div className="size-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <Activity className="size-4 text-orange-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {stats.totalUsers}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            Administrators & Managers
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Registrations */}
            <div className="grid gap-6 md:grid-cols-7">
                <Card className="col-span-4 border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                            <Activity className="size-5 text-blue-500" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.recentRegistrations.length > 0 ? (
                            <div className="space-y-4">
                                {stats.recentRegistrations.map(reg => (
                                    <div
                                        key={reg.id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700 transition-colors"
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
                                                            'Unknown'}
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
                                                        {reg.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-zinc-400 flex items-center gap-1">
                                                    Registered for
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
                                                ).toLocaleDateString()}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-[10px] text-zinc-400 hover:text-white px-2 hover:bg-zinc-800"
                                                asChild
                                            >
                                                <Link
                                                    href={`/admin/tournaments/${reg.tournamentId}`}
                                                >
                                                    View
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
                                <p>No recent activity found.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-3 border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                            <Trophy className="size-5 text-yellow-500" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button
                            variant="outline"
                            className="w-full h-14 justify-start border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 hover:text-white text-zinc-300 hover:border-blue-500/30 group"
                            asChild
                        >
                            <Link href="/admin/tournaments/new">
                                <div className="size-8 rounded bg-blue-500/10 flex items-center justify-center mr-4 group-hover:bg-blue-500/20 transition-colors">
                                    <Trophy className="size-4 text-blue-500" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">
                                        Create New Tournament
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                        Launch a new event
                                    </span>
                                </div>
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-14 justify-start border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 hover:text-white text-zinc-300 hover:border-purple-500/30 group"
                            asChild
                        >
                            <Link href="/admin/users">
                                <div className="size-8 rounded bg-purple-500/10 flex items-center justify-center mr-4 group-hover:bg-purple-500/20 transition-colors">
                                    <Users className="size-4 text-purple-500" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">
                                        Manage Users
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                        Admin access control
                                    </span>
                                </div>
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-14 justify-start border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 hover:text-white text-zinc-300 hover:border-zinc-500/30 group"
                            asChild
                        >
                            <Link href="/admin/settings">
                                <div className="size-8 rounded bg-zinc-500/10 flex items-center justify-center mr-4 group-hover:bg-zinc-500/20 transition-colors">
                                    <Settings className="size-4 text-zinc-400" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">
                                        Platform Settings
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                        Global configuration
                                    </span>
                                </div>
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
