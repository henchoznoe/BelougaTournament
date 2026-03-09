/**
 * File: components/ui/date-time-picker.tsx
 * Description: Date and time picker component combining Calendar popover with time input.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils/cn'

interface DateTimePickerProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export const DateTimePicker = ({
  value,
  onChange,
  disabled,
  placeholder = 'Sélectionner...',
}: DateTimePickerProps) => {
  const [open, setOpen] = useState(false)

  const date = value ? new Date(value) : undefined
  const isValidDate = date && !Number.isNaN(date.getTime())

  const timeValue = isValidDate
    ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    : ''

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return
    const hours = isValidDate ? date.getHours() : 0
    const minutes = isValidDate ? date.getMinutes() : 0
    const newDate = new Date(selectedDate)
    newDate.setHours(hours, minutes, 0, 0)
    onChange(newDate.toISOString())
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':').map(Number)
    const base = isValidDate ? new Date(date) : new Date()
    base.setHours(hours ?? 0, minutes ?? 0, 0, 0)
    onChange(base.toISOString())
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          data-empty={!isValidDate}
          className={cn(
            'h-10 w-full justify-start rounded-xl border-white/10 bg-white/5 text-left text-sm font-normal text-zinc-200',
            'hover:bg-white/5 hover:text-zinc-200',
            'data-[empty=true]:text-zinc-600',
          )}
        >
          <CalendarIcon className="size-4 text-zinc-500" />
          {isValidDate ? format(date, 'dd/MM/yyyy HH:mm') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={isValidDate ? date : undefined}
          onSelect={handleDateSelect}
        />
        <div className="border-t border-white/10 p-3">
          <Label className="text-xs text-muted-foreground">Heure</Label>
          <Input
            type="time"
            value={timeValue}
            onChange={handleTimeChange}
            disabled={disabled}
            className="mt-1.5 h-9 rounded-lg border-white/10 bg-white/5 text-sm text-zinc-200"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
