/**
 * File: components/features/admin/admin-promote-dialog.tsx
 * Description: Dialog for searching and promoting a user to admin role.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Loader2, Search, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { promoteToAdmin, searchUsersAction } from '@/lib/actions/admins'

interface AdminPromoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SearchResult = {
  id: string
  name: string
  email: string
  image: string | null
}

export const AdminPromoteDialog = ({
  open,
  onOpenChange,
}: AdminPromoteDialogProps) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [promotingId, setPromotingId] = useState<string | null>(null)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setPromotingId(null)
    }
  }, [open])

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    setQuery(value)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (value.length < 2) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const data = await searchUsersAction(value)
        setResults(data)
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [])

  const handlePromote = (userId: string) => {
    setPromotingId(userId)
    startTransition(async () => {
      const result = await promoteToAdmin({ userId })

      if (result.success) {
        toast.success(result.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Une erreur est survenue.')
        setPromotingId(null)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-zinc-950 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            Promouvoir un utilisateur
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Recherchez un utilisateur par nom ou email pour le promouvoir admin.
          </DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
            className="border-white/10 bg-white/5 pl-9 text-zinc-200 placeholder:text-zinc-600"
          />
        </div>

        {/* Results */}
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {isSearching && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-5 animate-spin text-zinc-500" />
            </div>
          )}

          {!isSearching && query.length >= 2 && results.length === 0 && (
            <p className="py-6 text-center text-sm text-zinc-500">
              Aucun utilisateur trouvé.
            </p>
          )}

          {!isSearching &&
            results.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/2 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name}
                        width={32}
                        height={32}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-zinc-400">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => handlePromote(user.id)}
                  className="ml-2 gap-1.5 bg-blue-600 text-white hover:bg-blue-500"
                >
                  {isPending && promotingId === user.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="size-3.5" />
                  )}
                  Promouvoir
                </Button>
              </div>
            ))}

          {query.length < 2 && query.length > 0 && (
            <p className="py-4 text-center text-xs text-zinc-600">
              Tapez au moins 2 caractères.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
