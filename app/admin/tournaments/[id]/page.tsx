/**
 * File: app/admin/tournaments/[id]/page.tsx
 * Description: Tournament manager page for viewing details, managing registrations, and updating settings.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { Edit } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CsvExportButton } from '@/components/admin/csv-export-button'
import { RegistrationsTable } from '@/components/admin/registrations-table'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { updateChallongeId } from '@/lib/actions/tournament-manager'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getTournament(id: string) {
    return await prisma.tournament.findUnique({
        where: { id },
        include: {
            registrations: {
                orderBy: { createdAt: 'desc' },
                include: {
                    players: {
                        include: {
                            data: true,
                        },
                    },
                },
            },
            fields: true,
        },
    })
}

export default async function TournamentManagerPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const tournament = await getTournament(id)

    if (!tournament) {
        notFound()
    }

    const fillRate = tournament.maxParticipants
        ? Math.round(
              (tournament.registrations.length / tournament.maxParticipants) *
                  100,
          )
        : 0

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        {tournament.title}
                    </h1>
                    <p className="text-zinc-400">
                        Manage tournament details and registrations
                    </p>
                </div>
                <Button asChild>
                    <Link href={`/admin/tournaments/${tournament.id}/edit`}>
                        <Edit className="mr-2 size-4" />
                        Edit Tournament
                    </Link>
                </Button>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="registrants">
                        Registrants ({tournament.registrations.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-zinc-800 bg-zinc-950">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-zinc-400">
                                    Fill Rate
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">
                                    {fillRate}%
                                </div>
                                <p className="text-xs text-zinc-500">
                                    {tournament.registrations.length} /{' '}
                                    {tournament.maxParticipants || '∞'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-zinc-800 bg-zinc-950">
                        <CardHeader>
                            <CardTitle>Challonge Integration</CardTitle>
                            <CardDescription>
                                Enter the Challonge Tournament ID to embed the
                                bracket on the public page.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                action={updateChallongeId.bind(
                                    null,
                                    tournament.id,
                                )}
                                className="flex gap-4"
                            >
                                <Input
                                    name="challongeId"
                                    placeholder="e.g. belouga_cup_1"
                                    defaultValue={tournament.challongeId || ''}
                                    className="max-w-md"
                                />
                                <Button type="submit">Save ID</Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="registrants" className="space-y-4">
                    <div className="flex justify-end">
                        <CsvExportButton
                            data={tournament.registrations}
                            fields={tournament.fields}
                        />
                    </div>

                    <div className="rounded-md border border-zinc-800 bg-zinc-950">
                        <RegistrationsTable
                            registrations={tournament.registrations}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
