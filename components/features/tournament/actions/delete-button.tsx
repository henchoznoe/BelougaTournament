'use client'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { deleteTournament } from '@/lib/actions/tournaments'
import { Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

interface DeleteTournamentButtonProps {
	id: string
}

export function DeleteTournamentButton({ id }: DeleteTournamentButtonProps) {
	const [isPending, startTransition] = useTransition()
	const [open, setOpen] = useState(false)


	const handleDelete = async () => {
		startTransition(async () => {
			try {
				const result = await deleteTournament(id)
				if (result?.message && result.message.includes('successfully')) {
					toast.success(result.message)
					setOpen(false)
				} else if (result?.message) {
					toast.error(result.message)
				}
			} catch (error) {
				toast.error('An unexpected error occurred.')
				console.error('Failed to delete tournament', error)
			}
		})
	}

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
					disabled={isPending}
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent className="border-zinc-800 bg-zinc-950 text-zinc-50">
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription className="text-zinc-400">
						This action cannot be undone. This will permanently delete the
						tournament and all associated data including registrations and
						matches.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="border-zinc-800 bg-transparent hover:bg-zinc-900 hover:text-white">
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						className="bg-red-600 text-white hover:bg-red-700"
						disabled={isPending}
					>
						{isPending ? 'Deleting...' : 'Delete'}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
