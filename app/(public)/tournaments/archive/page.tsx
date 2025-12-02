/**
 * File: app/(public)/tournaments/archive/page.tsx
 * Description: Public page for archived tournaments.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { Calendar, Trophy, Users } from 'lucide-react'
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

async function getArchivedTournaments() {
	const now = new Date()
	return await prisma.tournament.findMany({
		where: {
			OR: [{ isArchived: true }, { endDate: { lt: now } }],
		},
		orderBy: { endDate: 'desc' },
	})
}

export default async function ArchivePage() {
	const tournaments = await getArchivedTournaments()

	return (
		<div className="container mx-auto px-4 py-12">
			<div className="mb-8 space-y-4">
				<h1 className="text-4xl font-bold text-white">Tournament Archive</h1>
				<p className="text-zinc-400">Explore past tournaments and results.</p>
			</div>

			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{tournaments.length > 0 ? (
					tournaments.map(tournament => (
						<Card
							key={tournament.id}
							className="border-zinc-800 bg-zinc-900/50 opacity-80 hover:opacity-100 transition-opacity"
						>
							<CardHeader>
								<CardTitle className="text-xl text-zinc-200">
									{tournament.title}
								</CardTitle>
								<CardDescription className="line-clamp-2 text-zinc-500">
									{tournament.description}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4 text-sm text-zinc-400">
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4 text-zinc-500" />
									<span>
										Ended {new Date(tournament.endDate).toLocaleDateString()}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Trophy className="h-4 w-4 text-yellow-500/50" />
									<span>{tournament.format} Format</span>
								</div>
								<div className="flex items-center gap-2">
									<Users className="h-4 w-4 text-green-500/50" />
									<span>
										{tournament.maxParticipants
											? `${tournament.maxParticipants} Participants`
											: 'Open Registration'}
									</span>
								</div>
							</CardContent>
							<CardFooter>
								<Button
									asChild
									variant="secondary"
									className="w-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
								>
									<Link href={`/tournaments/${tournament.slug}`}>
										View Results
									</Link>
								</Button>
							</CardFooter>
						</Card>
					))
				) : (
					<div className="col-span-full py-12 text-center text-zinc-500">
						No archived tournaments found.
					</div>
				)}
			</div>
		</div>
	)
}
