/**
 * File: components/features/admin/sponsor-actions-dropdown.tsx
 * Description: Dropdown menu with quick actions for each sponsor row in the admin sponsors table.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Eye, EyeOff, Loader2, MoreHorizontal, Power } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toggleSponsorStatus } from '@/lib/actions/sponsors'
import { ROUTES } from '@/lib/config/routes'
import type { Sponsor } from '@/prisma/generated/prisma/client'

interface SponsorActionsDropdownProps {
  sponsor: Sponsor
}

export const SponsorActionsDropdown = ({
  sponsor,
}: SponsorActionsDropdownProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleSponsorStatus({ id: sponsor.id })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions pour ${sponsor.name}`}
          className="text-zinc-400 hover:text-zinc-200"
          onClick={e => e.stopPropagation()}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MoreHorizontal className="size-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="border-white/10 bg-zinc-950"
        onClick={e => e.stopPropagation()}
      >
        <DropdownMenuItem asChild>
          <Link href={ROUTES.ADMIN_SPONSOR_DETAIL(sponsor.id)}>
            <Eye className="size-4" />
            Voir le sponsor
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/5" />

        <DropdownMenuItem onClick={handleToggle} disabled={isPending}>
          {sponsor.enabled ? (
            <>
              <EyeOff className="size-4 text-zinc-400" />
              Désactiver
            </>
          ) : (
            <>
              <Power className="size-4 text-emerald-400" />
              Activer
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
