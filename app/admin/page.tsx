/**
 * File: app/admin/page.tsx
 * Description: Admin dashboard page displaying summary statistics and recent registrations.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

import { Trophy, UserCheck, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-zinc-800 bg-zinc-950">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            Total Tournaments
                        </CardTitle>
                        <Trophy className="size-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {stats.totalTournaments}
                        </div>
                        <p className="text-xs text-zinc-500">
                            {stats.activeTournaments} Active,{' '}
                            {stats.archivedTournaments} Archived
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-zinc-800 bg-zinc-950">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            Total Registrations
                        </CardTitle>
                        <Users className="size-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {stats.totalRegistrations}
                        </div>
                        <p className="text-xs text-zinc-500">
                            {stats.pendingRegistrations} Pending,{' '}
                            {stats.approvedRegistrations} Approved
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-zinc-800 bg-zinc-950">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            Total Participants
                        </CardTitle>
                        <UserCheck className="size-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {stats.totalParticipants}
                        </div>
                        <p className="text-xs text-zinc-500">
                            Across all tournaments
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-zinc-800 bg-zinc-950">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            Admin Users
                        </CardTitle>
                        <Users className="size-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {stats.totalUsers}
                        </div>
                        <p className="text-xs text-zinc-500">
                            System administrators
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Registrations */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">
                    Recent Activity
                </h2>
                <div className="rounded-md border border-zinc-800 bg-zinc-950">
                    {stats.recentRegistrations.length > 0 ? (
                        <div className="divide-y divide-zinc-800">
                            {stats.recentRegistrations.map(reg => (
                                <div
                                    key={reg.id}
                                    className="flex items-center justify-between p-4"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-white">
                                                {reg.teamName ||
                                                    reg.players[0]?.nickname ||
                                                    'Unknown'}
                                            </p>
                                            <Badge
                                                variant={
                                                    reg.status === 'APPROVED'
                                                        ? 'default'
                                                        : reg.status ===
                                                            'PENDING'
                                                          ? 'secondary'
                                                          : 'destructive'
                                                }
                                            >
                                                {reg.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-zinc-400">
                                            Registered for{' '}
                                            <span className="text-blue-400">
                                                {reg.tournament.title}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="text-sm text-zinc-500">
                                        {new Date(
                                            reg.createdAt,
                                        ).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-zinc-500">
                            No registrations yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
