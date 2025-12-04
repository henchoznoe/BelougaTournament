/**
 * File: app/admin/tournaments/[id]/page.tsx
 * Description: Tournament manager page for viewing details, managing registrations, and updating settings.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import {
    Edit,
    Eye,
    Trash2,
    Trophy,
    Users,
    Calendar,
    Swords,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CsvExportButton } from '@/components/admin/csv-export-button'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    deleteRegistration,
    updateChallongeId,
} from '@/lib/actions/tournament-manager'
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
                            <Trophy className="size-6 text-white" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter text-white">
                            {tournament.title}
                        </h1>
                    </div>
                    <p className="text-zinc-400 max-w-2xl">
                        Manage registrations, bracket integration, and
                        tournament settings.
                    </p>
                </div>
                <Button
                    asChild
                    variant="outline"
                    className="h-12 border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 hover:border-blue-500/50 hover:text-blue-400"
                >
                    <Link href={`/admin/tournaments/${tournament.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Tournament
                    </Link>
                </Button>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1 h-auto">
                    <TabsTrigger
                        value="overview"
                        className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white py-2 px-4"
                    >
                        Overview
                    </TabsTrigger>
                    <TabsTrigger
                        value="registrants"
                        className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white py-2 px-4"
                    >
                        Registrants ({tournament.registrations.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-zinc-400">
                                    Fill Rate
                                </CardTitle>
                                <Users className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">
                                    {fillRate}%
                                </div>
                                <div className="h-1.5 w-full bg-zinc-800 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(100, fillRate)}%`,
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">
                                    {tournament.registrations.length} /{' '}
                                    {tournament.maxParticipants || '∞'}{' '}
                                    participants
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-zinc-400">
                                    Format
                                </CardTitle>
                                <Swords className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">
                                    {tournament.format}
                                </div>
                                <p className="text-xs text-zinc-500 mt-1">
                                    Tournament Structure
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-zinc-400">
                                    Date
                                </CardTitle>
                                <Calendar className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">
                                    {new Date(
                                        tournament.startDate,
                                    ).toLocaleDateString()}
                                </div>
                                <p className="text-xs text-zinc-500 mt-1">
                                    Start Date
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-white">
                                Challonge Integration
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
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
                                className="flex gap-4 max-w-xl"
                            >
                                <Input
                                    name="challongeId"
                                    placeholder="e.g. belouga_cup_1"
                                    defaultValue={tournament.challongeId || ''}
                                    className="bg-zinc-900/50 border-zinc-800 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
                                />
                                <Button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-500 text-white"
                                >
                                    Save ID
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="registrants" className="space-y-6">
                    <div className="flex justify-end">
                        <CsvExportButton tournamentId={tournament.id} />
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 backdrop-blur-sm overflow-hidden shadow-xl">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/50">
                                    <TableHead className="text-zinc-400 font-medium uppercase tracking-wider text-xs py-4 pl-6">
                                        Name
                                    </TableHead>
                                    <TableHead className="text-zinc-400 font-medium uppercase tracking-wider text-xs py-4">
                                        Contact
                                    </TableHead>
                                    <TableHead className="text-zinc-400 font-medium uppercase tracking-wider text-xs py-4">
                                        Status
                                    </TableHead>
                                    <TableHead className="text-zinc-400 font-medium uppercase tracking-wider text-xs py-4">
                                        Date
                                    </TableHead>
                                    <TableHead className="text-right text-zinc-400 font-medium uppercase tracking-wider text-xs py-4 pr-6">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tournament.registrations.length > 0 ? (
                                    tournament.registrations.map(reg => (
                                        <TableRow
                                            key={reg.id}
                                            className="border-zinc-800/50 hover:bg-white/5 transition-colors group"
                                        >
                                            <TableCell className="font-medium text-white py-4 pl-6">
                                                {reg.teamName ||
                                                    reg.players[0]?.nickname ||
                                                    'Unknown'}
                                                {reg.players.length > 1 && (
                                                    <span className="ml-2 text-xs text-zinc-500">
                                                        ({reg.players.length}{' '}
                                                        players)
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-zinc-300 py-4">
                                                {reg.contactEmail}
                                            </TableCell>
                                            <TableCell className="text-zinc-300 py-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                        reg.status ===
                                                        'APPROVED'
                                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                            : reg.status ===
                                                                'PENDING'
                                                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    }`}
                                                >
                                                    {reg.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-zinc-300 py-4">
                                                {new Date(
                                                    reg.createdAt,
                                                ).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right py-4 pr-6">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Sheet>
                                                        <SheetTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </SheetTrigger>
                                                        <SheetContent className="overflow-y-auto bg-zinc-950 border-zinc-800 text-zinc-50 sm:max-w-xl">
                                                            <SheetHeader>
                                                                <SheetTitle className="text-2xl font-bold text-white">
                                                                    Registration
                                                                    Details
                                                                </SheetTitle>
                                                                <SheetDescription>
                                                                    {reg.teamName ||
                                                                        'Player Details'}
                                                                </SheetDescription>
                                                            </SheetHeader>
                                                            <div className="mt-8 space-y-6">
                                                                {reg.players.map(
                                                                    player => (
                                                                        <div
                                                                            key={
                                                                                player.id
                                                                            }
                                                                            className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6"
                                                                        >
                                                                            <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                                                                                {
                                                                                    player.nickname
                                                                                }
                                                                            </h4>
                                                                            <div className="space-y-3 text-sm">
                                                                                {player.data.map(
                                                                                    d => {
                                                                                        const fieldLabel =
                                                                                            tournament.fields.find(
                                                                                                f =>
                                                                                                    f.id ===
                                                                                                    d.tournamentFieldId,
                                                                                            )
                                                                                                ?.label ||
                                                                                            'Unknown Field'
                                                                                        return (
                                                                                            <div
                                                                                                key={
                                                                                                    d.id
                                                                                                }
                                                                                                className="flex justify-between items-center border-b border-zinc-800/50 pb-2 last:border-0 last:pb-0"
                                                                                            >
                                                                                                <span className="text-zinc-400">
                                                                                                    {
                                                                                                        fieldLabel
                                                                                                    }
                                                                                                </span>
                                                                                                <span className="text-white font-medium">
                                                                                                    {
                                                                                                        d.value
                                                                                                    }
                                                                                                </span>
                                                                                            </div>
                                                                                        )
                                                                                    },
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </SheetContent>
                                                    </Sheet>

                                                    <form
                                                        action={deleteRegistration.bind(
                                                            null,
                                                            reg.id,
                                                            tournament.id,
                                                        )}
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </form>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="h-32 text-center text-zinc-500"
                                        >
                                            No registrations yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
