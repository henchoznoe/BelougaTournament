/**
 * File: components/ui/date-time-picker.tsx
 * Description: Date and time picker combining shadcn Calendar with a time input in a Popover.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils/cn'

interface DateTimePickerProps {
  /** Current value as "YYYY-MM-DDTHH:mm" (datetime-local format) */
  value?: string
  /** Called with "YYYY-MM-DDTHH:mm" string */
  onChange?: (value: string) => void
  /** Placeholder text when no date is selected */
  placeholder?: string
  /** Additional className for the trigger button */
  className?: string
  /** Whether the picker is disabled */
  disabled?: boolean
}

/** Pad a number to 2 digits */
const pad = (n: number) => String(n).padStart(2, '0')

const DateTimePicker = ({
  value,
  onChange,
  placeholder = 'Sélectionner une date',
  className,
  disabled,
}: DateTimePickerProps) => {
  const [open, setOpen] = useState(false)

  // Parse current value
  const parsedDate = value ? new Date(`${value}:00`) : undefined
  const isValid = parsedDate && !Number.isNaN(parsedDate.getTime())

  const currentDate = isValid ? parsedDate : undefined
  const currentTime = isValid
    ? `${pad(parsedDate.getHours())}:${pad(parsedDate.getMinutes())}`
    : '12:00'

  const buildValue = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hours)}:${pad(minutes)}`
  }

  const handleDateSelect = (day: Date | undefined) => {
    if (!day) return
    const time = currentTime
    onChange?.(buildValue(day, time))
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value
    if (!currentDate) {
      // If no date yet, use today
      const today = new Date()
      onChange?.(buildValue(today, time))
    } else {
      onChange?.(buildValue(currentDate, time))
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'justify-start text-left font-normal',
            !currentDate && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="size-4" />
          {currentDate ? (
            format(currentDate, 'dd MMM yyyy HH:mm', { locale: fr })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={currentDate}
          onSelect={handleDateSelect}
          initialFocus
        />
        <div className="border-t p-3">
          <Input
            type="time"
            value={currentTime}
            onChange={handleTimeChange}
            className="h-9"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { DateTimePicker }
