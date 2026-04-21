/**
 * File: components/admin/tournaments/form/tournament-form-games.tsx
 * Description: Games section of the tournament form (multi-game tag input).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { Gamepad2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import type {
  FieldErrors,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form'
import {
  INPUT_CLASSES,
  LABEL_CLASSES,
  SECTION_CLASSES,
  SectionHeader,
} from '@/components/admin/tournaments/form/tournament-form-ui'
import { Label } from '@/components/ui/label'
import type { TournamentFormValues } from '@/lib/types/tournament-form'
import { cn } from '@/lib/utils/cn'

interface TournamentFormGamesProps {
  errors: FieldErrors<TournamentFormValues>
  setValue: UseFormSetValue<TournamentFormValues>
  watch: UseFormWatch<TournamentFormValues>
}

export const TournamentFormGames = ({
  errors,
  setValue,
  watch,
}: TournamentFormGamesProps) => {
  const games = watch('games')
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addGame = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed || games.includes(trimmed)) return
    setValue('games', [...games, trimmed], {
      shouldValidate: true,
      shouldDirty: true,
    })
    setInputValue('')
  }

  const removeGame = (index: number) => {
    setValue(
      'games',
      games.filter((_, i) => i !== index),
      {
        shouldValidate: true,
        shouldDirty: true,
      },
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addGame(inputValue)
    } else if (e.key === 'Backspace' && inputValue === '' && games.length > 0) {
      removeGame(games.length - 1)
    }
  }

  return (
    <div className={SECTION_CLASSES}>
      <SectionHeader icon={Gamepad2} title="Jeux" />
      <div className="space-y-2">
        <Label className={LABEL_CLASSES}>Jeux *</Label>

        {/* Tag input container */}
        <div
          className={cn(
            INPUT_CLASSES,
            'flex min-h-10 flex-wrap gap-1.5 px-2 py-1.5 cursor-text',
          )}
        >
          {games.map((game, index) => (
            <span
              key={game}
              className="inline-flex items-center gap-1 rounded-md bg-blue-600/20 px-2 py-0.5 text-xs font-medium text-blue-300 border border-blue-500/30"
            >
              {game}
              <button
                type="button"
                aria-label={`Retirer ${game}`}
                onClick={e => {
                  e.stopPropagation()
                  removeGame(index)
                }}
                className="ml-0.5 rounded-sm text-blue-400 hover:text-blue-200"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) addGame(inputValue)
            }}
            placeholder={games.length === 0 ? 'Ex: League of Legends' : ''}
            className="min-w-32 flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none"
          />
        </div>
        <p className="text-xs text-zinc-500">
          Entrée ou virgule pour ajouter un jeu
        </p>
        {errors.games?.message && (
          <p className="text-xs text-red-400">{errors.games.message}</p>
        )}
      </div>
    </div>
  )
}
