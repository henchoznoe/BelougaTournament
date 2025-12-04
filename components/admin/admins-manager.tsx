/**
 * File: components/admin/admins-manager.tsx
 * Description: Client component for managing admin users with premium styling and French localization.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

'use client'

import {
	KeyRound,
	Loader2,
	MoreHorizontal,
	Shield,
	ShieldAlert,
	Trash2,
	UserPlus,
} from 'lucide-react'
import { useActionState, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	createAdmin,
	deleteAdmin,
	resetAdminPassword,
} from '@/lib/actions/users'
import { cn } from '@/lib/utils'

interface User {
	id: string
	email: string
	role: string
	createdAt: Date
}

interface AdminsManagerProps {
	users: User[]
	currentUserId: string
	currentUserRole: string
}

const initialState = {
	message: '',
	errors: {},
}

export function AdminsManager({
	users,
	currentUserId,
	currentUserRole,
}: AdminsManagerProps) {
	const [createState, createAction, isCreating] = useActionState(
		createAdmin,
		initialState,
	)
	const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
	const [createAdminOpen, setCreateAdminOpen] = useState(false)
	const [selectedUser, setSelectedUser] = useState<User | null>(null)
	const [newPassword, setNewPassword] = useState('')
	const [isResetting, setIsResetting] = useState(false)

	const isSuperAdmin = currentUserRole === 'SUPERADMIN'

	const handleResetPassword = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!selectedUser || !newPassword) return

		setIsResetting(true)
		try {
			await resetAdminPassword(selectedUser.id, newPassword)
			toast.success(`Mot de passe modifié pour ${selectedUser.email}`)
			setResetPasswordOpen(false)
			setNewPassword('')
			setSelectedUser(null)
		} catch (error) {
			console.error(error)
			toast.error('Erreur lors de la modification du mot de passe')
		} finally {
			setIsResetting(false)
		}
	}

	const handleDelete = async (userId: string) => {
		if (confirm('Êtes-vous sûr de vouloir supprimer cet administrateur ?')) {
			const result = await deleteAdmin(userId)
			if (result.message.includes('success')) {
				toast.success('Administrateur supprimé')
			} else {
				toast.error(result.message)
			}
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-xl font-bold text-white">
						Liste des Administrateurs
					</h2>
					<p className="text-sm text-zinc-400">
						Gérez les accès et les rôles de la plateforme.
					</p>
				</div>
				{isSuperAdmin && (
					<Dialog
						open={createAdminOpen}
						onOpenChange={setCreateAdminOpen}
					>
						<DialogTrigger asChild>
							<Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20">
								<UserPlus className="mr-2 size-4" />
								Ajouter un administrateur
							</Button>
						</DialogTrigger>
						<DialogContent className="bg-zinc-950 border-white/10 text-zinc-50">
							<DialogHeader>
								<DialogTitle>Nouvel Administrateur</DialogTitle>
								<DialogDescription>
									Créez un nouveau compte administrateur. Ils
									auront accès au tableau de bord.
								</DialogDescription>
							</DialogHeader>
							<form action={createAction} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										name="email"
										type="email"
										required
										placeholder="admin@exemple.com"
										className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-blue-500/20"
									/>
									{createState?.errors?.email && (
										<p className="text-sm text-red-500">
											{createState.errors.email}
										</p>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="password">
										Mot de passe
									</Label>
									<Input
										id="password"
										name="password"
										type="password"
										required
										placeholder="******"
										className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-blue-500/20"
									/>
									{createState?.errors?.password && (
										<p className="text-sm text-red-500">
											{createState.errors.password}
										</p>
									)}
								</div>
								<DialogFooter>
									<Button
										type="submit"
										disabled={isCreating}
										className="bg-blue-600 hover:bg-blue-500 text-white"
									>
										{isCreating ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Création...
											</>
										) : (
											'Créer le compte'
										)}
									</Button>
								</DialogFooter>
							</form>
							{createState?.message && (
								<p
									className={cn(
										'text-sm text-center mt-2',
										createState.message.includes('success')
											? 'text-green-500'
											: 'text-red-500',
									)}
								>
									{createState.message}
								</p>
							)}
						</DialogContent>
					</Dialog>
				)}
			</div>

			<div className="rounded-xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl overflow-hidden shadow-xl">
				<div className="grid grid-cols-12 p-4 font-medium border-b border-white/10 bg-white/5 text-zinc-400 text-xs uppercase tracking-wider">
					<div className="col-span-5 pl-2">Email</div>
					<div className="col-span-3">Rôle</div>
					<div className="col-span-3">Date de création</div>
					<div className="col-span-1 text-right pr-2">Actions</div>
				</div>
				<div className="divide-y divide-white/5">
					{users.map(user => (
						<div
							key={user.id}
							className="grid grid-cols-12 p-4 items-center hover:bg-white/5 transition-colors group"
						>
							<div className="col-span-5 pl-2 flex items-center gap-3">
								<div className="size-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold">
									{user.email.charAt(0).toUpperCase()}
								</div>
								<span className="text-zinc-200 font-medium truncate">
									{user.email}
								</span>
							</div>
							<div className="col-span-3">
								<span
									className={cn(
										'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
										user.role === 'SUPERADMIN'
											? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
											: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
									)}
								>
									{user.role === 'SUPERADMIN' ? (
										<ShieldAlert className="size-3" />
									) : (
										<Shield className="size-3" />
									)}
									{user.role}
								</span>
							</div>
							<div className="col-span-3 text-zinc-400 text-sm">
								{new Date(user.createdAt).toLocaleDateString(
									'fr-FR',
								)}
							</div>
							<div className="col-span-1 text-right pr-2">
								{isSuperAdmin &&
									user.role !== 'SUPERADMIN' && (
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
												>
													<MoreHorizontal className="size-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent
												align="end"
												className="bg-zinc-950 border-zinc-800 text-zinc-200"
											>
												<DropdownMenuLabel>
													Actions
												</DropdownMenuLabel>
												<DropdownMenuSeparator className="bg-zinc-800" />
												<DropdownMenuItem
													onClick={() => {
														setSelectedUser(user)
														setResetPasswordOpen(
															true,
														)
													}}
													className="focus:bg-zinc-900 focus:text-white cursor-pointer"
												>
													<KeyRound className="mr-2 size-4 text-yellow-500" />
													Réinitialiser MDP
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() =>
														handleDelete(user.id)
													}
													className="focus:bg-red-900/20 focus:text-red-400 text-red-500 cursor-pointer"
												>
													<Trash2 className="mr-2 size-4" />
													Supprimer
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									)}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Reset Password Dialog */}
			<Dialog
				open={resetPasswordOpen}
				onOpenChange={setResetPasswordOpen}
			>
				<DialogContent className="bg-zinc-950 border-white/10 text-zinc-50">
					<DialogHeader>
						<DialogTitle>Réinitialiser le mot de passe</DialogTitle>
						<DialogDescription>
							Entrez un nouveau mot de passe pour{' '}
							<span className="text-white font-medium">
								{selectedUser?.email}
							</span>
							.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleResetPassword} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="new-password">
								Nouveau mot de passe
							</Label>
							<Input
								id="new-password"
								type="password"
								value={newPassword}
								onChange={e => setNewPassword(e.target.value)}
								required
								minLength={6}
								className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-blue-500/20"
							/>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setResetPasswordOpen(false)}
								className="border-white/10 hover:bg-white/5 text-zinc-300"
							>
								Annuler
							</Button>
							<Button
								type="submit"
								disabled={isResetting}
								className="bg-blue-600 hover:bg-blue-500 text-white"
							>
								{isResetting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Modification...
									</>
								) : (
									'Confirmer'
								)}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	)
}
