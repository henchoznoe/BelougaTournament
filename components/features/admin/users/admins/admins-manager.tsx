/**
 * File: components/features/admin/users/admins/admins-manager.tsx
 * Description: Client component for managing admin users with premium styling and French localization.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

'use client'

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { useActionState, useEffect, useState } from 'react'
import {
  Loader2,
  MoreHorizontal,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  UserPlus,
} from 'lucide-react'
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
  promoteUser,
} from '@/lib/actions/admin'
import { cn, formatDate } from '@/lib/utils'
import { fr } from "@/lib/i18n/dictionaries/fr"
import { Role } from '@/prisma/generated/prisma/enums'

// ... existing types

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

interface AdminUser {
  id: string
  email: string
  role: Role | string
  createdAt: Date
}

interface AdminsManagerProps {
  users: AdminUser[]
  currentUserId: string
  currentUserRole: Role | string
}

interface ActionState {
  success?: boolean
  message: string
  errors?: Record<string, string[]>
}

const INITIAL_STATE: ActionState = {
  success: false,
  message: '',
  errors: {},
}



// ... existing ListHeader

const ListHeader = () => {
  return (
    <div className="grid grid-cols-12 border-b border-white/10 bg-white/5 p-4 text-xs font-medium uppercase tracking-wider text-zinc-400">
      <div className="col-span-5 pl-2">{fr.pages.admin.admins.manager.table.headers.email}</div>
      <div className="col-span-3">{fr.pages.admin.admins.manager.table.headers.role}</div>
      <div className="col-span-3">{fr.pages.admin.admins.manager.table.headers.date}</div>
      <div className="col-span-1 pr-2 text-right">{fr.pages.admin.admins.manager.table.headers.actions}</div>
    </div>
  )
}

const AdminRow = ({
  user,
  isViewerSuperAdmin,
  onDelete,
  onPromote
}: {
  user: AdminUser
  isViewerSuperAdmin: boolean
  onDelete: (id: string) => void
  onPromote: (id: string) => void
}) => {
  const isSuperAdminTarget = user.role === Role.SUPERADMIN
  const isAdminTarget = user.role === Role.ADMIN
  const isUserTarget = user.role === Role.USER || (user.role as string) === 'USER' // Handle type string backup
  const canEdit = isViewerSuperAdmin && !isSuperAdminTarget

  const roleLabel = isSuperAdminTarget
    ? fr.pages.admin.admins.manager.roles.superadmin
    : isAdminTarget
      ? fr.pages.admin.admins.manager.roles.admin
      : fr.pages.admin.admins.manager.roles.user

  const roleIcon = isSuperAdminTarget
    ? <ShieldAlert className="size-3" />
    : isAdminTarget
      ? <Shield className="size-3" />
      : <User className="size-3" />

  const roleStyle = isSuperAdminTarget
    ? 'border-purple-500/20 bg-purple-500/10 text-purple-400'
    : isAdminTarget
      ? 'border-blue-500/20 bg-blue-500/10 text-blue-400'
      : 'border-zinc-500/20 bg-zinc-500/10 text-zinc-400'

  return (
    <div className="group grid grid-cols-12 items-center p-4 transition-colors hover:bg-white/5">
      <div className="col-span-5 flex items-center gap-3 pl-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-zinc-800 font-bold text-zinc-400">
          {user.email.charAt(0).toUpperCase()}
        </div>
        <span className="truncate font-medium text-zinc-200">
          {user.email}
        </span>
      </div>

      <div className="col-span-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
            roleStyle
          )}
        >
          {roleIcon}
          {roleLabel}
        </span>
      </div>

      <div className="col-span-3 text-sm text-zinc-400">
        {formatDate(user.createdAt)}
      </div>

      <div className="col-span-1 pr-2 text-right">
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-zinc-800 bg-zinc-950 text-zinc-200"
            >
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />

              {isUserTarget && (
                <DropdownMenuItem
                  onClick={() => onPromote(user.id)}
                  className="cursor-pointer text-blue-500 focus:bg-blue-900/20 focus:text-blue-400"
                >
                  <ShieldCheck className="mr-2 size-4" />
                  {fr.pages.admin.admins.manager.table.actions.promote}
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => onDelete(user.id)}
                className="cursor-pointer text-red-500 focus:bg-red-900/20 focus:text-red-400"
              >
                <Trash2 className="mr-2 size-4" />
                {fr.pages.admin.admins.manager.table.actions.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

export const AdminsManager = ({
  users,
  currentUserRole,
}: AdminsManagerProps) => {
  const [createState, createAction, isCreating] = useActionState(createAdmin, INITIAL_STATE)
  const [createAdminOpen, setCreateAdminOpen] = useState(false)

  const isSuperAdmin = currentUserRole === Role.SUPERADMIN

  useEffect(() => {
    if (createState.success) {
      setCreateAdminOpen(false)
      toast.success(createState.message)
    }
  }, [createState])

  const handleDelete = async (userId: string) => {
    if (confirm(fr.pages.admin.admins.manager.table.confirm.delete)) {
      const result = await deleteAdmin(userId)
      if (result.success) {
        toast.success(fr.pages.admin.admins.manager.toasts.deleteSuccess)
      } else {
        toast.error(result.message)
      }
    }
  }

  const handlePromote = async (userId: string) => {
    if (confirm(fr.pages.admin.admins.manager.table.confirm.promote)) {
      const result = await promoteUser(userId)
      if (result.success) {
        toast.success(fr.pages.admin.admins.manager.toasts.promoteSuccess)
      } else {
        toast.error(result.message)
      }
    }
  }

  // Define sort order: USER (pending first), then ADMIN, then SUPERADMIN
  const sortedUsers = [...users].sort((a, b) => {
    const roleOrder: Record<string, number> = {
      [Role.USER]: 0,
      [Role.ADMIN]: 1,
      [Role.SUPERADMIN]: 2,
    }
    const roleA = roleOrder[a.role as string] ?? 99
    const roleB = roleOrder[b.role as string] ?? 99

    if (roleA !== roleB) return roleA - roleB
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{fr.pages.admin.admins.manager.title}</h2>
          <p className="text-sm text-zinc-400">{fr.pages.admin.admins.manager.subtitle}</p>
        </div>

        {isSuperAdmin && (
          <Dialog open={createAdminOpen} onOpenChange={setCreateAdminOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500">
                <UserPlus className="mr-2 size-4" />
                {fr.pages.admin.admins.manager.buttons.add}
              </Button>
            </DialogTrigger>
            <DialogContent className="border-white/10 bg-zinc-950 text-zinc-50">
              <DialogHeader>
                <DialogTitle>{fr.pages.admin.admins.manager.dialog.title}</DialogTitle>
                <DialogDescription>{fr.pages.admin.admins.manager.dialog.description}</DialogDescription>
              </DialogHeader>
              <form action={createAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{fr.pages.admin.admins.manager.labels.email}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder={fr.pages.admin.admins.manager.placeholders.email}
                    className="border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                  {createState?.errors?.email && (
                    <p className="text-sm text-red-500">{createState.errors.email}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="bg-blue-600 text-white hover:bg-blue-500"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {fr.pages.admin.admins.manager.buttons.creating}
                      </>
                    ) : (
                      fr.pages.admin.admins.manager.buttons.create
                    )}
                  </Button>
                </DialogFooter>
              </form>
              {createState?.message && !createState.success && (
                <p className="mt-2 text-center text-sm text-red-500">
                  {createState.message}
                </p>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 shadow-xl backdrop-blur-xl">
        <ListHeader />
        <div className="divide-y divide-white/5">
          {sortedUsers.map((user) => (
            <AdminRow
              key={user.id}
              user={user}
              isViewerSuperAdmin={isSuperAdmin}
              onDelete={handleDelete}
              onPromote={handlePromote}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
