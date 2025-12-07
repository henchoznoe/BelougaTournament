/**
 * File: components/admin/admins-manager.tsx
 * Description: Client component for managing admin users with premium styling and French localization.
 * Author: Noé Henchoz
 * Date: 2025-12-07
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
import { useActionState, useEffect, useState } from 'react'
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
} from '@/lib/actions/admins'
import { cn, formatDate } from '@/lib/utils'
import { Role } from '@/prisma/generated/prisma/enums'

// Types
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

// Constants
const INITIAL_STATE: ActionState = {
  success: false,
  message: '',
  errors: {},
}

const CONTENT = {
  TITLE_PAGE: 'Liste des Administrateurs',
  SUBTITLE_PAGE: 'Gérez les accès et les rôles de la plateforme.',

  // Create Dialog
  BTN_ADD: 'Ajouter un administrateur',
  TITLE_CREATE: 'Nouvel Administrateur',
  DESC_CREATE: 'Créez un nouveau compte administrateur. Ils auront accès au tableau de bord.',
  LABEL_EMAIL: 'Email',
  PLACEHOLDER_EMAIL: 'admin@exemple.com',
  LABEL_PASSWORD: 'Mot de passe',
  PLACEHOLDER_PASSWORD: '******',
  BTN_CREATE: 'Créer le compte',
  BTN_CREATING: 'Création...',

  // Reset Dialog
  TITLE_RESET: 'Réinitialiser le mot de passe',
  DESC_RESET: (email: string) => `Entrez un nouveau mot de passe pour ${email}.`,
  LABEL_NEW_PASS: 'Nouveau mot de passe',
  BTN_CANCEL: 'Annuler',
  BTN_CONFIRM: 'Confirmer',
  BTN_MODIFYING: 'Modification...',

  // List & Actions
  COL_EMAIL: 'Email',
  COL_ROLE: 'Rôle',
  COL_DATE: 'Date de création',
  COL_ACTIONS: 'Actions',
  ACTION_RESET: 'Réinitialiser MDP',
  ACTION_DELETE: 'Supprimer',
  CONFIRM_DELETE: 'Êtes-vous sûr de vouloir supprimer cet administrateur ?',

  // Toasts
  TOAST_RESET_SUCCESS: (email: string) => `Mot de passe modifié pour ${email}`,
  TOAST_RESET_ERROR: 'Erreur lors de la modification du mot de passe',
  TOAST_DELETE_SUCCESS: 'Administrateur supprimé',
} as const

const ListHeader = () => {
  return (
    <div className="grid grid-cols-12 border-b border-white/10 bg-white/5 p-4 text-xs font-medium uppercase tracking-wider text-zinc-400">
      <div className="col-span-5 pl-2">{CONTENT.COL_EMAIL}</div>
      <div className="col-span-3">{CONTENT.COL_ROLE}</div>
      <div className="col-span-3">{CONTENT.COL_DATE}</div>
      <div className="col-span-1 pr-2 text-right">{CONTENT.COL_ACTIONS}</div>
    </div>
  )
}

const AdminRow = ({
  user,
  isViewerSuperAdmin,
  onReset,
  onDelete
}: {
  user: AdminUser
  isViewerSuperAdmin: boolean
  onReset: (user: AdminUser) => void
  onDelete: (id: string) => void
}) => {
  const isSuperAdminTarget = user.role === Role.SUPERADMIN
  const canEdit = isViewerSuperAdmin && !isSuperAdminTarget

  return (
    <div className="group grid grid-cols-12 items-center p-4 transition-colors hover:bg-white/5">
      {/* Email + Avatar */}
      <div className="col-span-5 flex items-center gap-3 pl-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-zinc-800 font-bold text-zinc-400">
          {user.email.charAt(0).toUpperCase()}
        </div>
        <span className="truncate font-medium text-zinc-200">
          {user.email}
        </span>
      </div>

      {/* Role Badge */}
      <div className="col-span-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
            isSuperAdminTarget
              ? 'border-purple-500/20 bg-purple-500/10 text-purple-400'
              : 'border-blue-500/20 bg-blue-500/10 text-blue-400',
          )}
        >
          {isSuperAdminTarget ? <ShieldAlert className="size-3" /> : <Shield className="size-3" />}
          {user.role}
        </span>
      </div>

      {/* Date */}
      <div className="col-span-3 text-sm text-zinc-400">
        {formatDate(user.createdAt)}
      </div>

      {/* Actions Menu */}
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
              <DropdownMenuItem
                onClick={() => onReset(user)}
                className="cursor-pointer focus:bg-zinc-900 focus:text-white"
              >
                <KeyRound className="mr-2 size-4 text-yellow-500" />
                {CONTENT.ACTION_RESET}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(user.id)}
                className="cursor-pointer text-red-500 focus:bg-red-900/20 focus:text-red-400"
              >
                <Trash2 className="mr-2 size-4" />
                {CONTENT.ACTION_DELETE}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

export function AdminsManager({
  users,
  currentUserRole,
}: AdminsManagerProps) {
  // State for Create Action
  const [createState, createAction, isCreating] = useActionState(createAdmin, INITIAL_STATE)
  const [createAdminOpen, setCreateAdminOpen] = useState(false)

  // State for Reset Action
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const isSuperAdmin = currentUserRole === Role.SUPERADMIN

  // Effect to close dialog on successful creation
  useEffect(() => {
    if (createState.success) {
      setCreateAdminOpen(false)
      toast.success(createState.message)
    }
  }, [createState])

  // --- Handlers ---

  const handleOpenReset = (user: AdminUser) => {
    setSelectedUser(user)
    setResetPasswordOpen(true)
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !newPassword) return

    setIsResetting(true)
    try {
      const result = await resetAdminPassword(selectedUser.id, newPassword)
      if (result.success) {
        toast.success(CONTENT.TOAST_RESET_SUCCESS(selectedUser.email))
        setResetPasswordOpen(false)
        setNewPassword('')
        setSelectedUser(null)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error(error)
      toast.error(CONTENT.TOAST_RESET_ERROR)
    } finally {
      setIsResetting(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (confirm(CONTENT.CONFIRM_DELETE)) {
      const result = await deleteAdmin(userId)
      if (result.success) {
        toast.success(CONTENT.TOAST_DELETE_SUCCESS)
      } else {
        toast.error(result.message)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{CONTENT.TITLE_PAGE}</h2>
          <p className="text-sm text-zinc-400">{CONTENT.SUBTITLE_PAGE}</p>
        </div>

        {isSuperAdmin && (
          <Dialog open={createAdminOpen} onOpenChange={setCreateAdminOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500">
                <UserPlus className="mr-2 size-4" />
                {CONTENT.BTN_ADD}
              </Button>
            </DialogTrigger>
            <DialogContent className="border-white/10 bg-zinc-950 text-zinc-50">
              <DialogHeader>
                <DialogTitle>{CONTENT.TITLE_CREATE}</DialogTitle>
                <DialogDescription>{CONTENT.DESC_CREATE}</DialogDescription>
              </DialogHeader>
              <form action={createAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{CONTENT.LABEL_EMAIL}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder={CONTENT.PLACEHOLDER_EMAIL}
                    className="border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                  {createState?.errors?.email && (
                    <p className="text-sm text-red-500">{createState.errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{CONTENT.LABEL_PASSWORD}</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder={CONTENT.PLACEHOLDER_PASSWORD}
                    className="border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                  {createState?.errors?.password && (
                    <p className="text-sm text-red-500">{createState.errors.password}</p>
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
                        {CONTENT.BTN_CREATING}
                      </>
                    ) : (
                      CONTENT.BTN_CREATE
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

      {/* Users List */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 shadow-xl backdrop-blur-xl">
        <ListHeader />
        <div className="divide-y divide-white/5">
          {users.map((user) => (
            <AdminRow
              key={user.id}
              user={user}
              isViewerSuperAdmin={isSuperAdmin}
              onReset={handleOpenReset}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {/* Reset Password Modal */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent className="border-white/10 bg-zinc-950 text-zinc-50">
          <DialogHeader>
            <DialogTitle>{CONTENT.TITLE_RESET}</DialogTitle>
            <DialogDescription>
              {selectedUser ? CONTENT.DESC_RESET(selectedUser.email) : ''}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{CONTENT.LABEL_NEW_PASS}</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetPasswordOpen(false)}
                className="border-white/10 text-zinc-300 hover:bg-white/5"
              >
                {CONTENT.BTN_CANCEL}
              </Button>
              <Button
                type="submit"
                disabled={isResetting}
                className="bg-blue-600 text-white hover:bg-blue-500"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {CONTENT.BTN_MODIFYING}
                  </>
                ) : (
                  CONTENT.BTN_CONFIRM
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
