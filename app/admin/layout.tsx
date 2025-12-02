/**
 * File: app/admin/layout.tsx
 * Description: Layout for the admin dashboard, including the sidebar navigation.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/actions/auth'
import { getSession, UserRole } from '@/lib/auth'

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const session = await getSession()

	if (
		!session ||
		!session.user ||
		(session.user.role !== UserRole.ADMIN &&
			session.user.role !== UserRole.SUPERADMIN)
	) {
		redirect('/login')
	}

	return (
		<div className="flex min-h-screen flex-col md:flex-row">
			<aside className="w-full border-r bg-zinc-950 p-6 md:w-64">
				<div className="mb-8 flex items-center gap-2 font-bold text-xl text-white">
					<span>Belouga Admin</span>
				</div>
				<nav className="flex flex-col gap-2">
					<Button
						asChild
						className="justify-start text-zinc-400 hover:text-white"
						variant="ghost"
					>
						<Link href="/admin">Dashboard</Link>
					</Button>
					<Button
						asChild
						className="justify-start text-zinc-400 hover:text-white"
						variant="ghost"
					>
						<Link href="/admin/tournaments">Tournaments</Link>
					</Button>
					<Button
						asChild
						className="justify-start text-zinc-400 hover:text-white"
						variant="ghost"
					>
						<Link href="/admin/users">Users</Link>
					</Button>
					<div className="mt-auto pt-4 border-t border-zinc-800">
						<form action={logout}>
							<Button
								variant="ghost"
								className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
							>
								Logout
							</Button>
						</form>
					</div>
				</nav>
			</aside>
			<main className="flex-1 bg-zinc-900 p-8">{children}</main>
		</div>
	)
}
