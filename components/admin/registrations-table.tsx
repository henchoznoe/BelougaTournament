'use client'

import { Registration, RegistrationStatus } from '@prisma/client'
import { Check, X, Clock, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    approveRegistration,
    moveToWaitlist,
    rejectRegistration,
} from '@/lib/actions/registrations'

interface RegistrationsTableProps {
    registrations: (Registration & {
        players: { nickname: string }[]
    })[]
}

export function RegistrationsTable({ registrations }: RegistrationsTableProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null)

    const handleAction = async (
        action: (id: string) => Promise<{ success: boolean; error?: string }>,
        id: string,
        successMessage: string
    ) => {
        setIsLoading(id)
        try {
            const result = await action(id)
            if (result.success) {
                toast.success(successMessage)
            } else {
                toast.error(result.error || 'Action failed')
            }
        } catch (error) {
            toast.error('An unexpected error occurred')
        } finally {
            setIsLoading(null)
        }
    }

    const getStatusBadgeVariant = (status: RegistrationStatus) => {
        switch (status) {
            case 'APPROVED':
                return 'default' // Usually black/primary
            case 'PENDING':
                return 'secondary' // Gray
            case 'WAITLIST':
                return 'outline'
            case 'REJECTED':
                return 'destructive'
            default:
                return 'secondary'
        }
    }

    const getStatusColor = (status: RegistrationStatus) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-green-500/15 text-green-500 hover:bg-green-500/25'
            case 'PENDING':
                return 'bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25'
            case 'WAITLIST':
                return 'bg-orange-500/15 text-orange-500 hover:bg-orange-500/25'
            case 'REJECTED':
                return 'bg-red-500/15 text-red-500 hover:bg-red-500/25'
            default:
                return 'bg-zinc-500/15 text-zinc-500'
        }
    }

    return (
        <div className="rounded-md border border-zinc-800 bg-zinc-950">
            <Table>
                <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                        <TableHead className="text-zinc-400">Team / Player</TableHead>
                        <TableHead className="text-zinc-400">Contact Email</TableHead>
                        <TableHead className="text-zinc-400">Status</TableHead>
                        <TableHead className="text-zinc-400">Created At</TableHead>
                        <TableHead className="text-right text-zinc-400">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {registrations.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                                No registrations found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        registrations.map((reg) => (
                            <TableRow key={reg.id} className="border-zinc-800 hover:bg-zinc-900/50">
                                <TableCell className="font-medium text-white">
                                    {reg.teamName || reg.players[0]?.nickname || 'Unknown'}
                                    {reg.players.length > 1 && (
                                        <span className="ml-2 text-xs text-zinc-500">
                                            ({reg.players.length} players)
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-zinc-300">{reg.contactEmail}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant="secondary"
                                        className={`${getStatusColor(reg.status)} border-0`}
                                    >
                                        {reg.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-zinc-300">
                                    {new Date(reg.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                                                disabled={isLoading === reg.id}
                                            >
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-zinc-200">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    handleAction(approveRegistration, reg.id, 'Registration approved')
                                                }
                                                className="focus:bg-zinc-900 focus:text-green-400 cursor-pointer"
                                            >
                                                <Check className="mr-2 h-4 w-4" />
                                                Approve
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    handleAction(moveToWaitlist, reg.id, 'Moved to waitlist')
                                                }
                                                className="focus:bg-zinc-900 focus:text-orange-400 cursor-pointer"
                                            >
                                                <Clock className="mr-2 h-4 w-4" />
                                                Waitlist
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-zinc-800" />
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    handleAction(rejectRegistration, reg.id, 'Registration rejected')
                                                }
                                                className="focus:bg-zinc-900 focus:text-red-400 cursor-pointer"
                                            >
                                                <X className="mr-2 h-4 w-4" />
                                                Reject
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
