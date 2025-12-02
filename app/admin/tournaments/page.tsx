/**
 * File: app/admin/tournaments/page.tsx
 * Description: List of all tournaments with management actions.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { Edit, Eye, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { deleteTournament } from '@/lib/actions/tournaments'
import { prisma } from '@/lib/prisma'

async function getTournaments() {
	return await prisma.tournament.findMany({
		orderBy: { startDate: 'desc' },
		include: {
			_count: {
				select: { registrations: true },
			},
		},
	})
}

export default async function TournamentsPage() {
	const tournaments = await getTournaments()

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold text-white">Tournaments</h1>
				<Button asChild>
					<Link href="/admin/tournaments/new">
						<Plus className="mr-2 h-4 w-4" />
						Create Tournament
					</Link>
				</Button>
			</div>

			<div className="rounded-md border border-zinc-800 bg-zinc-950">
				<Table>
					<TableHeader>
						<TableRow className="border-zinc-800 hover:bg-zinc-900/50">
							<TableHead className="text-zinc-400">Title</TableHead>
							<TableHead className="text-zinc-400">Date</TableHead>
							<TableHead className="text-zinc-400">Format</TableHead>
							<TableHead className="text-zinc-400">Registrants</TableHead>
							<TableHead className="text-right text-zinc-400">
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{tournaments.length > 0 ? (
							tournaments.map(tournament => (
								<TableRow
									key={tournament.id}
									className="border-zinc-800 hover:bg-zinc-900/50"
								>
									<TableCell className="font-medium text-white">
										{tournament.title}
									</TableCell>
									<TableCell className="text-zinc-300">
										{new Date(tournament.startDate).toLocaleDateString()}
									</TableCell>
									<TableCell className="text-zinc-300">
										{tournament.format}
									</TableCell>
									<TableCell className="text-zinc-300">
										{tournament._count.registrations}
										{tournament.maxParticipants
											? ` / ${tournament.maxParticipants}`
											: ''}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-2">
											<Button
												asChild
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
											>
												<Link href={`/admin/tournaments/${tournament.id}`}>
													<Eye className="h-4 w-4" />
												</Link>
											</Button>
											<Button
												asChild
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
											>
												<Link href={`/admin/tournaments/${tournament.id}/edit`}>
													<Edit className="h-4 w-4" />
												</Link>
											</Button>
											<form action={deleteTournament.bind(null, tournament.id)}>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
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
									className="h-24 text-center text-zinc-500"
								>
									No tournaments found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	)
}
