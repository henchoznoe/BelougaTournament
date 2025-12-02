/**
 * File: app/admin/settings/users-manager.tsx
 * Description: Client component for managing admin users.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

'use client'

import { Trash2 } from 'lucide-react'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createAdmin, deleteAdmin } from '@/lib/actions/users'

interface User {
	id: string
	email: string
	role: string
	createdAt: Date
}

interface UsersManagerProps {
	users: User[]
	currentUserId: string
}

const initialState = {
	message: '',
	errors: {},
}

export function UsersManager({ users, currentUserId }: UsersManagerProps) {
	const [state, action, isPending] = useActionState(createAdmin, initialState)

	return (
		<div className="space-y-8">
			<div className="space-y-4">
				<h3 className="text-lg font-medium">Create New Admin</h3>
				<form action={action} className="flex gap-4 items-end">
					<div className="space-y-2 flex-1">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							name="email"
							type="email"
							required
							placeholder="admin@example.com"
						/>
						{state?.errors?.email && (
							<p className="text-sm text-red-500">{state.errors.email}</p>
						)}
					</div>
					<div className="space-y-2 flex-1">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							name="password"
							type="password"
							required
							placeholder="******"
						/>
						{state?.errors?.password && (
							<p className="text-sm text-red-500">{state.errors.password}</p>
						)}
					</div>
					<Button type="submit" disabled={isPending}>
						{isPending ? 'Creating...' : 'Create Admin'}
					</Button>
				</form>
				{state?.message && (
					<p
						className={`text-sm ${state.message.includes('success') ? 'text-green-500' : 'text-red-500'}`}
					>
						{state.message}
					</p>
				)}
			</div>

			<div className="space-y-4">
				<h3 className="text-lg font-medium">Existing Admins</h3>
				<div className="rounded-md border">
					<div className="grid grid-cols-3 p-4 font-medium border-b bg-muted/50">
						<div>Email</div>
						<div>Role</div>
						<div className="text-right">Actions</div>
					</div>
					{users.map(user => (
						<div
							key={user.id}
							className="grid grid-cols-3 p-4 items-center border-b last:border-0"
						>
							<div>{user.email}</div>
							<div>{user.role}</div>
							<div className="text-right">
								{user.id !== currentUserId && (
									<form
										action={async () => {
											if (
												confirm('Are you sure you want to delete this admin?')
											) {
												await deleteAdmin(user.id)
											}
										}}
									>
										<Button
											variant="ghost"
											size="icon"
											className="text-red-500 hover:text-red-600 hover:bg-red-100/10"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</form>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
