/**
 * File: components/admin/admin-sidebar.tsx
 * Description: Client-side sidebar navigation for the admin dashboard.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

'use client'

import {
	Home,
	LayoutDashboard,
	LogOut,
	Settings,
	Trophy,
	Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
	userEmail: string
	logoutAction: () => Promise<void>
}

export function AdminSidebar({ userEmail, logoutAction }: AdminSidebarProps) {
	const pathname = usePathname()

	const isActive = (path: string) => {
		if (path === '/admin') {
			return pathname === '/admin'
		}
		return pathname.startsWith(path)
	}

	const menuItems = [
		{
			label: 'Tableau de bord',
			href: '/admin',
			icon: LayoutDashboard,
		},
		{
			label: 'Tournois',
			href: '/admin/tournaments',
			icon: Trophy,
		},
		{
			label: 'Administrateurs',
			href: '/admin/admins',
			icon: Users,
		},
		{
			label: 'Paramètres',
			href: '/admin/settings',
			icon: Settings,
		},
	]

	return (
		<aside className="w-full border-r border-white/10 bg-zinc-900/50 backdrop-blur-xl p-6 md:w-72 flex flex-col sticky top-0 h-screen z-50">
			<div className="mb-10 flex items-center gap-2">
				<span className="text-2xl font-black tracking-tighter text-white">
					BELOUGA
					<span className="text-blue-500">.</span>
				</span>
			</div>

			<nav className="flex flex-col gap-2 flex-1">
				<p className="px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
					Menu
				</p>
				{menuItems.map(item => (
					<Link
						key={item.href}
						href={item.href}
						className={cn(
							'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
							isActive(item.href)
								? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500'
								: 'text-zinc-400 hover:text-blue-400 hover:bg-blue-600/10  hover:border-blue-500',
						)}
					>
						<item.icon className="mr-3 h-4 w-4" />
						{item.label}
					</Link>
				))}
			</nav>

			<div className="mt-auto pt-6 border-t border-white/10">
				<div className="mb-4 px-2 p-3 rounded-lg bg-white/5 border border-white/5">
					<p className="text-xs font-medium text-zinc-500 mb-1">
						Connecté en tant que
					</p>
					<p
						className="text-sm font-medium text-white truncate"
						title={userEmail}
					>
						{userEmail}
					</p>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="w-full justify-center bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 hover:text-gray-400 border border-gray-500/20 cursor-pointer"
					>
						<Link href="/">
							<Home className="h-3 w-3" />
						</Link>
					</Button>
					<form action={logoutAction}>
						<Button
							variant="destructive"
							size="sm"
							className="w-full justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20 cursor-pointer"
						>
							<LogOut className="h-4 w-4" />
						</Button>
					</form>
				</div>
			</div>
		</aside>
	)
}
