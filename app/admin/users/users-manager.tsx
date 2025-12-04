/**
 * File: app/admin/users/users-manager.tsx
 * Description: Client component for managing admin users.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

'use client'

import { KeyRound, Loader2, Pencil, Trash2, UserPlus } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    createAdmin,
    deleteAdmin,
    resetAdminPassword,
    updateAdmin,
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
    const [createState, createAction, isCreating] = useActionState(
        createAdmin,
        initialState,
    )
    const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
    const [createAdminOpen, setCreateAdminOpen] = useState(false)
    const [editAdminOpen, setEditAdminOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [newPassword, setNewPassword] = useState('')
    const [isResetting, setIsResetting] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)

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

    const handleUpdateAdmin = async (formData: FormData) => {
        if (!selectedUser) return
        setIsUpdating(true)
        try {
            const result = await updateAdmin(
                selectedUser.id,
                initialState,
                formData,
            )
            if (result.message.includes('success')) {
                toast.success(result.message)
                setEditAdminOpen(false)
                setSelectedUser(null)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to update admin')
        } finally {
            setIsUpdating(false)
        }
    }

    const canEdit = (targetUser: User) => {
        // Can always edit self
        if (targetUser.id === currentUserId) return true
        // SuperAdmin can edit other Admins (but not other SuperAdmins)
        if (
            currentUserRole === 'SUPERADMIN' &&
            targetUser.role !== 'SUPERADMIN'
        )
            return true
        return false
    }

    const canDelete = (targetUser: User) => {
        // Cannot delete self
        if (targetUser.id === currentUserId) return false
        // Cannot delete SuperAdmins
        if (targetUser.role === 'SUPERADMIN') return false
        // Only SuperAdmin can delete
        if (currentUserRole === 'SUPERADMIN') return true
        return false
    }

    const canResetPassword = (targetUser: User) => {
        // SuperAdmin can reset anyone's password (except maybe themselves via this flow? usually yes)
        if (currentUserRole === 'SUPERADMIN') return true
        return false
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                {currentUserRole === 'SUPERADMIN' && (
                    <Dialog
                        open={createAdminOpen}
                        onOpenChange={setCreateAdminOpen}
                    >
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <UserPlus className="mr-2 size-4" />
                                Add New Admin
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50">
                            <DialogHeader>
                                <DialogTitle>Create New Admin</DialogTitle>
                                <DialogDescription>
                                    Add a new administrator to the platform.
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
                                        placeholder="admin@example.com"
                                        className="bg-zinc-900 border-zinc-800"
                                    />
                                    {createState?.errors?.email && (
                                        <p className="text-sm text-red-500">
                                            {createState.errors.email}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        placeholder="******"
                                        className="bg-zinc-900 border-zinc-800"
                                    />
                                    {createState?.errors?.password && (
                                        <p className="text-sm text-red-500">
                                            {createState.errors.password}
                                        </p>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isCreating}>
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Admin'
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

            <div className="rounded-md border border-zinc-800 bg-zinc-950">
                <div className="grid grid-cols-3 p-4 font-medium border-b border-zinc-800 bg-zinc-900/50 text-zinc-400">
                    <div>Email</div>
                    <div>Role</div>
                    <div className="text-right">Actions</div>
                </div>
                {users.map(user => (
                    <div
                        key={user.id}
                        className="grid grid-cols-3 p-4 items-center border-b border-zinc-800 last:border-0 hover:bg-zinc-900/30 transition-colors"
                    >
                        <div className="text-zinc-200">{user.email}</div>
                        <div>
                            <span
                                className={cn(
                                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2',
                                    user.role === 'SUPERADMIN'
                                        ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                                        : 'border-zinc-800 bg-zinc-900 text-zinc-400',
                                )}
                            >
                                {user.role}
                            </span>
                        </div>
                        <div className="text-right flex justify-end gap-2">
                            {canEdit(user) && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                    onClick={() => {
                                        setSelectedUser(user)
                                        setEditAdminOpen(true)
                                    }}
                                    title="Edit User"
                                >
                                    <Pencil className="size-4" />
                                </Button>
                            )}

                            {canResetPassword(user) && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10"
                                    onClick={() => {
                                        setSelectedUser(user)
                                        setResetPasswordOpen(true)
                                    }}
                                    title="Reset Password"
                                >
                                    <KeyRound className="size-4" />
                                </Button>
                            )}

                            {canDelete(user) && (
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
                                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                        title="Delete Admin"
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Admin Dialog */}
            <Dialog open={editAdminOpen} onOpenChange={setEditAdminOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-50">
                    <DialogHeader>
                        <DialogTitle>Edit Admin</DialogTitle>
                        <DialogDescription>
                            Update details for {selectedUser?.email}.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <form action={handleUpdateAdmin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-email">Email</Label>
                                <Input
                                    id="edit-email"
                                    name="email"
                                    type="email"
                                    defaultValue={selectedUser.email}
                                    required
                                    className="bg-zinc-900 border-zinc-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-role">Role</Label>
                                <Select
                                    name="role"
                                    defaultValue={selectedUser.role}
                                    disabled={
                                        selectedUser.role === 'SUPERADMIN' &&
                                        selectedUser.id !== currentUserId
                                    }
                                >
                                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                        <SelectItem value="ADMIN">
                                            Admin
                                        </SelectItem>
                                        <SelectItem value="SUPERADMIN">
                                            Super Admin
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditAdminOpen(false)}
                                    className="border-zinc-800 hover:bg-zinc-900 text-zinc-300"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isUpdating}>
                                    {isUpdating && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
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
                                className="border-zinc-800 hover:bg-zinc-900 text-zinc-300"
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
