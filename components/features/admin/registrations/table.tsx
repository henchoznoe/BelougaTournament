/**
 * File: components/features/admin/registrations/table.tsx
 * Description: Client component for displaying and managing tournament registrations.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

"use client"

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { Check, Clock, MoreHorizontal, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  approveRegistration,
  moveToWaitlist,
  rejectRegistration,
} from "@/lib/actions/registration"
import { formatDateTime } from "@/lib/utils"
import type { Registration } from "@/prisma/generated/prisma/client"
import { RegistrationStatus } from "@/prisma/generated/prisma/enums"
import { fr } from "@/lib/i18n/dictionaries/fr"

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

interface RegistrationsTableProps {
  registrations: (Registration & {
    players: { nickname: string }[]
  })[]
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const TABLE_HEADERS = [
  fr.pages.admin.registration.table.headers.teamPlayer,
  fr.pages.admin.registration.table.headers.email,
  fr.pages.admin.registration.table.headers.status,
  fr.pages.admin.registration.table.headers.createdAt,
  fr.pages.admin.registration.table.headers.actions,
]

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

export const RegistrationsTable = ({
  registrations,
}: RegistrationsTableProps) => {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleAction = async (
    action: (id: string) => Promise<{ success: boolean; error?: string }>,
    id: string,
    successMessage: string,
  ) => {
    setIsLoading(id)
    try {
      const result = await action(id)
      if (result.success) {
        toast.success(successMessage)
      } else {
        toast.error(
          result.error ||
            fr.pages.admin.registration.table.toasts.actionFailed,
        )
      }
    } catch (_error) {
      toast.error(fr.common.errors.generic)
    } finally {
      setIsLoading(null)
    }
  }

  const getStatusColor = (status: RegistrationStatus) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-500/15 text-green-500 hover:bg-green-500/25"
      case "PENDING":
        return "bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25"
      case "WAITLIST":
        return "bg-orange-500/15 text-orange-500 hover:bg-orange-500/25"
      case "REJECTED":
        return "bg-red-500/15 text-red-500 hover:bg-red-500/25"
      default:
        return "bg-zinc-500/15 text-zinc-500"
    }
  }

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
            {TABLE_HEADERS.map((header, index) => (
              <TableHead
                key={header}
                className={`text-zinc-400 ${
                  index === TABLE_HEADERS.length - 1 ? "text-right" : ""
                }`}
              >
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-zinc-500"
              >
                {fr.pages.admin.registration.table.noData}
              </TableCell>
            </TableRow>
          ) : (
            registrations.map((reg) => (
              <TableRow
                key={reg.id}
                className="border-zinc-800 hover:bg-zinc-900/50"
              >
                <TableCell className="font-medium text-white">
                  {reg.teamName ||
                    reg.players[0]?.nickname ||
                    fr.pages.admin.registration.table.unknownName}
                  {reg.players.length > 1 && (
                    <span className="ml-2 text-xs text-zinc-500">
                      {fr.pages.admin.registration.table.playersCount(reg.players.length)}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {reg.contactEmail}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`${getStatusColor(reg.status)} border-0`}
                  >
                    {reg.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-300">
                  {formatDateTime(reg.createdAt)}
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
                    <DropdownMenuContent
                      align="end"
                      className="bg-zinc-950 border-zinc-800 text-zinc-200"
                    >
                      <DropdownMenuLabel>
                        {fr.pages.admin.registration.table.actions.label}
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() =>
                          handleAction(
                            approveRegistration,
                            reg.id,
                            fr.pages.admin.registration.table.toasts.approveSuccess,
                          )
                        }
                        className="focus:bg-zinc-900 focus:text-green-400 cursor-pointer"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {fr.pages.admin.registration.table.actions.approve}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleAction(
                            moveToWaitlist,
                            reg.id,
                            fr.pages.admin.registration.table.toasts.waitlistSuccess,
                          )
                        }
                        className="focus:bg-zinc-900 focus:text-orange-400 cursor-pointer"
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {fr.pages.admin.registration.table.actions.waitlist}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-zinc-800" />
                      <DropdownMenuItem
                        onClick={() =>
                          handleAction(
                            rejectRegistration,
                            reg.id,
                            fr.pages.admin.registration.table.toasts.rejectSuccess,
                          )
                        }
                        className="focus:bg-zinc-900 focus:text-red-400 cursor-pointer"
                      >
                        <X className="mr-2 h-4 w-4" />
                        {fr.pages.admin.registration.table.actions.reject}
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
