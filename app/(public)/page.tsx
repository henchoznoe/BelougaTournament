import { Calendar, Trophy, Users } from 'lucide-react'
import Image from 'next/image'
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
		take: 6,
		where: { isArchived: false },
	})
}

export default async function LandingPage() {
	const tournaments = await getTournaments()
	const featuredTournament = tournaments[0] // Simplistic "featured" logic

	return (
		<div className="flex flex-col gap-16 pb-16">
			{/* Hero Section */}
			<section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden border-b border-zinc-800 bg-zinc-900 px-4 text-center">
				{/* Background Image */}
				<div className="absolute inset-0 z-0">
					<Image
						alt="Belouga Tournament Background"
						className="object-cover opacity-40"
						fill
						priority
						src="/assets/Complet_Wall.png"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-zinc-950/30" />
				</div>

				<div className="relative z-10 max-w-4xl space-y-8 animate-in fade-in zoom-in duration-1000">
					<h1 className="text-5xl font-black tracking-tighter text-white sm:text-7xl lg:text-8xl drop-shadow-2xl">
						BELOUGA{' '}
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
							TOURNAMENT
						</span>
					</h1>
					<p className="mx-auto max-w-2xl text-lg text-zinc-300 sm:text-xl font-medium drop-shadow-md">
						The ultimate competitive platform. Join the community, prove your
						worth, and claim victory in our high-stakes tournaments.
					</p>
					<div className="flex flex-wrap justify-center gap-6">
						{featuredTournament ? (
							<Button
								asChild
								className="h-14 px-8 text-lg font-bold bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
								size="lg"
							>
								<Link href={`/tournaments/${featuredTournament.slug}`}>
									Register for {featuredTournament.title}
								</Link>
							</Button>
						) : (
							<Button
								className="h-14 px-8 text-lg bg-zinc-800/50 backdrop-blur border border-zinc-700 text-zinc-400"
								disabled
								size="lg"
							>
								No Upcoming Tournaments
							</Button>
						)}
						<Button
							asChild
							className="h-14 px-8 text-lg border-zinc-700 bg-zinc-950/50 backdrop-blur hover:bg-zinc-900 text-white hover:text-blue-400 transition-all"
							size="lg"
							variant="outline"
						>
							<Link href="#tournaments">View All Tournaments</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Tournaments Grid */}
			<section className="container mx-auto px-4" id="tournaments">
				<div className="mb-8 flex items-center justify-between">
					<h2 className="text-3xl font-bold text-white">
						Upcoming Tournaments
					</h2>
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
										<Calendar className="h-4 w-4 text-blue-500" />
										<span>
											{new Date(tournament.startDate).toLocaleDateString()}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<Trophy className="h-4 w-4 text-yellow-500" />
										<span>{tournament.format} Format</span>
									</div>
									<div className="flex items-center gap-2">
										<Users className="h-4 w-4 text-green-500" />
										<span>
											{tournament.maxParticipants
												? `Max ${tournament.maxParticipants} ${tournament.format === 'TEAM' ? 'Teams' : 'Players'}`
												: 'Open Registration'}
										</span>
									</div>
								</CardContent>
								<CardFooter>
									<Button
										asChild
										className="w-full bg-zinc-800 hover:bg-zinc-700"
									>
										<Link href={`/tournaments/${tournament.slug}`}>
											View Details
										</Link>
									</Button>
								</CardFooter>
							</Card>
						))
					) : (
						<div className="col-span-full py-12 text-center text-zinc-500">
							No tournaments scheduled at the moment.
						</div>
					)}
				</div>
			</section>

			{/* Stream Section */}
			<section className="container mx-auto px-4" id="stream">
				<h2 className="mb-8 text-3xl font-bold text-white">Live Stream</h2>
				<div className="aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
					<iframe
						allowFullScreen
						className="h-full w-full"
						height="100%"
						src="https://player.twitch.tv/?channel=quentadoulive&parent=localhost&parent=belouga-tournament.vercel.app"
						width="100%"
					></iframe>
				</div>
			</section>
		</div>
	)
}
