/**
 * File: lib/utils/calendar.ts
 * Description: Utility functions for generating iCalendar (.ics) files from tournament data.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { ROUTES } from '@/lib/config/routes'
import { stripHtml } from '@/lib/utils/formatting'

/** Minimal tournament data needed to generate a calendar event. */
export type CalendarEventData = {
  title: string
  slug: string
  startDate: Date | string
  endDate: Date | string
  description: string
  games: string[]
}

const ICS_DOMAIN = 'belougatournament.ch'
const ICS_PRODID = '-//Belouga Tournament//Belouga Tournament//FR'
const MAX_LINE_OCTETS = 75

/** Escapes text values per RFC 5545 §3.3.11. */
const escapeIcsText = (text: string): string =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')

/** Folds a content line at 75 octets per RFC 5545 §3.1. */
const foldIcsLine = (line: string): string => {
  if (line.length <= MAX_LINE_OCTETS) return line

  const parts: string[] = [line.slice(0, MAX_LINE_OCTETS)]
  let offset = MAX_LINE_OCTETS

  while (offset < line.length) {
    // Continuation lines start with a space, leaving 74 octets for content
    parts.push(` ${line.slice(offset, offset + MAX_LINE_OCTETS - 1)}`)
    offset += MAX_LINE_OCTETS - 1
  }

  return parts.join('\r\n')
}

/** Formats a Date (or ISO string) as an iCalendar UTC date-time: YYYYMMDDTHHMMSSZ. */
const formatIcsDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const y = d.getUTCFullYear()
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const h = String(d.getUTCHours()).padStart(2, '0')
  const mi = String(d.getUTCMinutes()).padStart(2, '0')
  const s = String(d.getUTCSeconds()).padStart(2, '0')
  return `${y}${mo}${day}T${h}${mi}${s}Z`
}

/**
 * Generates a valid RFC 5545 iCalendar string for a tournament event.
 * The output uses CRLF line endings as required by the spec.
 */
export const generateIcsContent = (data: CalendarEventData): string => {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}${ROUTES.TOURNAMENTS}/${data.slug}`
  const gamesLine =
    data.games.length > 0 ? `Jeux : ${data.games.join(', ')}` : ''
  const stripped = stripHtml(data.description)
  const descriptionParts = [gamesLine, stripped, `Plus d'infos : ${url}`]
    .filter(Boolean)
    .join('\n\n')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `PRODID:${ICS_PRODID}`,
    'BEGIN:VEVENT',
    `UID:${data.slug}@${ICS_DOMAIN}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(data.startDate)}`,
    `DTEND:${formatIcsDate(data.endDate)}`,
    `SUMMARY:${escapeIcsText(data.title)}`,
    `DESCRIPTION:${escapeIcsText(descriptionParts)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`
}

/** Builds a plain-text description for calendar services (non-ICS). */
const buildPlainDescription = (data: CalendarEventData): string => {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}${ROUTES.TOURNAMENTS}/${data.slug}`
  const gamesLine =
    data.games.length > 0 ? `Jeux : ${data.games.join(', ')}` : ''
  const stripped = stripHtml(data.description)
  return [gamesLine, stripped, `Plus d'infos : ${url}`]
    .filter(Boolean)
    .join('\n\n')
}

/** Generates a Google Calendar event creation URL. */
export const generateGoogleCalendarUrl = (data: CalendarEventData): string => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: data.title,
    dates: `${formatIcsDate(data.startDate)}/${formatIcsDate(data.endDate)}`,
    details: buildPlainDescription(data),
    sprop: `website:${process.env.NEXT_PUBLIC_APP_URL}${ROUTES.TOURNAMENTS}/${data.slug}`,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** Generates an Outlook.com calendar event creation URL. */
export const generateOutlookCalendarUrl = (data: CalendarEventData): string => {
  const start =
    typeof data.startDate === 'string'
      ? data.startDate
      : data.startDate.toISOString()
  const end =
    typeof data.endDate === 'string' ? data.endDate : data.endDate.toISOString()
  const params = new URLSearchParams({
    rru: 'addevent',
    subject: data.title,
    startdt: start,
    enddt: end,
    body: buildPlainDescription(data),
    path: '/calendar/action/compose',
  })
  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`
}

/** Triggers a browser download of a .ics file for the given tournament. */
export const downloadIcsFile = (data: CalendarEventData): void => {
  const content = generateIcsContent(data)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${data.slug}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
