/**
 * File: app/(public)/tournaments/page.tsx
 * Description: Public page listing all upcoming tournaments.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

import { Calendar, Trophy, Users, Archive } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { prisma } from '@/lib/prisma'

async function getTournaments() {
    return await prisma.tournament.findMany({
        orderBy: { startDate: 'asc' },
        where: { isArchived: false },
    })
}

export default async function TournamentsPage() {
    const tournaments = await getTournaments()

    return (
        <div className="container mx-auto px-4 py-12 min-h-[80vh]">
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-white">
                        Tous les Tournois
                    </h1>
                    <p className="text-zinc-400">
                        Découvrez et inscrivez-vous aux prochains tournois.
                    </p>
                </div>
                <Button
                    asChild
                    variant="outline"
                    className="border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                    <Link href="/tournaments/archive">
                        <Archive className="mr-2 size-4" />
                        Voir les archives
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {tournaments.length > 0 ? (
                    tournaments.map(tournament => (
                        <Card
                            className="border-zinc-800 bg-zinc-900 transition-transform hover:scale-[1.02]"
                            key={tournament.id}
                        >
                            <CardHeader>
                                <CardTitle className="text-xl text-white">
                                    {tournament.title}
                                </CardTitle>
                                <CardDescription className="line-clamp-2 text-zinc-400">
                                    {tournament.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-zinc-300">
                                <div className="flex items-center gap-2">
                                    <Calendar className="size-4 text-blue-500" />
                                    <span>
                                        {new Date(
                                            tournament.startDate,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Trophy className="size-4 text-yellow-500" />
                                    <span>{tournament.format} Format</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="size-4 text-green-500" />
                                    <span>
                                        {tournament.maxParticipants
                                            ? `Max ${tournament.maxParticipants} ${tournament.format === 'TEAM' ? 'Équipes' : 'Joueurs'}`
                                            : 'Inscriptions ouvertes'}
                                    </span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    asChild
                                    className="w-full bg-zinc-800 hover:bg-zinc-700"
                                >
                                    <Link
                                        href={`/tournaments/${tournament.slug}`}
                                    >
                                        Voir les détails
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-zinc-500">
                        Aucun tournoi prévu pour le moment.
                    </div>
                )}
            </div>
        </div>
    )
}
