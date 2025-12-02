/**
 * File: app/(public)/tournaments/[slug]/page.tsx
 * Description: Public tournament detail page with registration and bracket view.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { Calendar, Users } from 'lucide-react'
import { notFound } from 'next/navigation'
import { RegistrationForm } from '@/components/tournament/registration-form'
import { prisma } from '@/lib/prisma'

async function getTournament(slug: string) {
	return await prisma.tournament.findUnique({
		include: {
			fields: {
				orderBy: { order: 'asc' },
			},
		},
		where: { slug },
	})
}

export default async function TournamentPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	const tournament = await getTournament(slug)

	if (!tournament) {
		notFound()
	}

	const now = new Date()
	const isRegistrationOpen =
		now >= tournament.registrationOpen && now <= tournament.registrationClose

	return (
		<div className="container mx-auto max-w-5xl px-4 py-12">
			<div className="mb-8 space-y-4">
				<h1 className="text-4xl font-extrabold text-white sm:text-5xl">
					{tournament.title}
				</h1>
				<div className="flex flex-wrap items-center gap-6 text-zinc-400">
					<div className="flex items-center gap-2">
						<Calendar className="h-5 w-5 text-blue-500" />
						<span>{new Date(tournament.startDate).toLocaleDateString()}</span>
					</div>
					<div className="flex items-center gap-2">
						<Users className="h-5 w-5 text-green-500" />
						<span>{tournament.format} Format</span>
					</div>
					{tournament.maxParticipants && (
						<div className="rounded-full bg-zinc-800 px-3 py-1 text-sm font-medium text-zinc-300">
							Max {tournament.maxParticipants} Participants
						</div>
					)}
				</div>
			</div>

			<div className="grid gap-12 lg:grid-cols-3">
				<div className="lg:col-span-2 space-y-8">
					<div className="prose prose-invert max-w-none rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
						<h3 className="text-xl font-bold text-white">
							About this Tournament
						</h3>
						<p className="whitespace-pre-wrap text-zinc-300">
							{tournament.description}
						</p>
					</div>

					{/* Challonge Bracket */}
					{tournament.challongeId && (
						<div className="space-y-4">
							<h3 className="text-xl font-bold text-white">Bracket</h3>
							<div className="aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
								<iframe
									src={`https://challonge.com/${tournament.challongeId}/module`}
									width="100%"
									height="100%"
									frameBorder="0"
									scrolling="auto"
									allowTransparency
									title="Tournament Bracket"
								></iframe>
							</div>
						</div>
					)}

					{/* Stream Embed if available */}
					{tournament.streamUrl && (
						<div className="space-y-4">
							<h3 className="text-xl font-bold text-white">Live Stream</h3>
							<div className="aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
								{/* Simplified embed logic - assuming standard Twitch/YouTube URL handling would go here */}
								<div className="flex h-full items-center justify-center text-zinc-500">
									<iframe
										src={tournament.streamUrl} // Ideally parse this to get embed URL
										width="100%"
										height="100%"
										allowFullScreen
										title="Live Stream"
									></iframe>
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="space-y-6">
					<div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
						<h3 className="mb-4 text-xl font-bold text-white">Registration</h3>
						{isRegistrationOpen ? (
							<div className="space-y-4">
								<p className="text-sm text-zinc-400">
									Registration is open until{' '}
									{new Date(tournament.registrationClose).toLocaleDateString()}.
								</p>
								{/* Registration Form is rendered here */}
								<RegistrationForm tournament={tournament} />
							</div>
						) : (
							<div className="rounded-lg bg-red-900/20 p-4 text-center text-red-200 border border-red-900/50">
								<p className="font-semibold">
									Registration is currently closed.
								</p>
								<p className="text-sm mt-1 opacity-80">
									{now < tournament.registrationOpen
										? `Opens on ${new Date(tournament.registrationOpen).toLocaleDateString()}`
										: 'Registration has ended.'}
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
