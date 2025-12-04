/**
 * File: app/admin/settings/users-manager.tsx
 * Description: Client component for managing admin users.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

'use client'

import { KeyRound, Loader2, Trash2 } from 'lucide-react'
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
} from '@/components/ui/dialog'
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

interface UsersManagerProps {
    users: User[]
    currentUserId: string
    currentUserRole: string
}

const initialState = {
    message: '',
    errors: {},
}

export function UsersManager({
    users,
    currentUserId,
    currentUserRole,
}: UsersManagerProps) {
    const [state, action, isPending] = useActionState(createAdmin, initialState)
    const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [newPassword, setNewPassword] = useState('')
    const [isResetting, setIsResetting] = useState(false)

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedUser || !newPassword) return

        setIsResetting(true)
        try {
            await resetAdminPassword(selectedUser.id, newPassword)
            toast.success(`Password updated for ${selectedUser.email}`)
            setResetPasswordOpen(false)
            setNewPassword('')
            setSelectedUser(null)
        } catch (error) {
            console.error(error)
            toast.error('Failed to reset password')
        } finally {
            setIsResetting(false)
        }
    }

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
                            <p className="text-sm text-red-500">
                                {state.errors.email}
                            </p>
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
                            <p className="text-sm text-red-500">
                                {state.errors.password}
                            </p>
                        )}
                    </div>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? 'Creating...' : 'Create Admin'}
                    </Button>
                </form>
                {state?.message && (
                    <p
                        className={cn(
                            'text-sm',
                            state.message.includes('success')
                                ? 'text-green-500'
                                : 'text-red-500',
                        )}
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
                            <div className="text-right flex justify-end gap-2">
                                {currentUserRole === 'SUPERADMIN' &&
                                    user.id !== currentUserId && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-100/10"
                                            onClick={() => {
                                                setSelectedUser(user)
                                                setResetPasswordOpen(true)
                                            }}
                                        >
                                            <KeyRound className="size-4" />
                                        </Button>
                                    )}
                                {user.id !== currentUserId && (
                                    <form
                                        action={async () => {
                                            if (
                                                confirm(
                                                    'Are you sure you want to delete this admin?',
                                                )
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
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Dialog
                open={resetPasswordOpen}
                onOpenChange={setResetPasswordOpen}
            >
                <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50">
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Enter a new password for {selectedUser?.email}.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setResetPasswordOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isResetting}>
                                {isResetting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Confirm Reset
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
