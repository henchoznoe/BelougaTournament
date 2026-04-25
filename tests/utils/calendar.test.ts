/**
 * File: tests/utils/calendar.test.ts
 * Description: Unit tests for iCalendar (.ics) generation utility.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CalendarEventData } from '@/lib/utils/calendar'
import {
  downloadIcsFile,
  generateGoogleCalendarUrl,
  generateIcsContent,
  generateOutlookCalendarUrl,
} from '@/lib/utils/calendar'

vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://example.com')

const BASE_DATA: CalendarEventData = {
  title: 'Summer Cup 2026',
  slug: 'summer-cup-2026',
  startDate: new Date(Date.UTC(2026, 5, 15, 14, 0, 0)),
  endDate: new Date(Date.UTC(2026, 5, 16, 20, 0, 0)),
  description: '<p>Un tournoi <strong>incroyable</strong> !</p>',
  games: ['Valorant', 'Rocket League'],
}

describe('generateIcsContent', () => {
  describe('calendar structure', () => {
    it('starts with BEGIN:VCALENDAR and ends with END:VCALENDAR', () => {
      const ics = generateIcsContent(BASE_DATA)
      expect(ics).toMatch(/^BEGIN:VCALENDAR\r\n/)
      expect(ics).toMatch(/END:VCALENDAR\r\n$/)
    })

    it('includes VERSION, CALSCALE, METHOD, and PRODID', () => {
      const ics = generateIcsContent(BASE_DATA)
      expect(ics).toContain('VERSION:2.0\r\n')
      expect(ics).toContain('CALSCALE:GREGORIAN\r\n')
      expect(ics).toContain('METHOD:PUBLISH\r\n')
      expect(ics).toContain('Belouga Tournament')
    })

    it('uses CRLF line endings throughout', () => {
      const ics = generateIcsContent(BASE_DATA)
      const lines = ics.split('\r\n')
      // Last element after split is empty (trailing CRLF)
      expect(lines[lines.length - 1]).toBe('')
      // No bare LF (that isn't part of CRLF)
      expect(ics.replace(/\r\n/g, '')).not.toContain('\n')
    })
  })

  describe('event content', () => {
    it('contains VEVENT block with SUMMARY', () => {
      const ics = generateIcsContent(BASE_DATA)
      expect(ics).toContain('BEGIN:VEVENT\r\n')
      expect(ics).toContain('END:VEVENT\r\n')
      expect(ics).toContain('SUMMARY:Summer Cup 2026\r\n')
    })

    it('formats DTSTART and DTEND as UTC date-time', () => {
      const ics = generateIcsContent(BASE_DATA)
      expect(ics).toContain('DTSTART:20260615T140000Z\r\n')
      expect(ics).toContain('DTEND:20260616T200000Z\r\n')
    })

    it('generates deterministic UID from slug', () => {
      const ics = generateIcsContent(BASE_DATA)
      expect(ics).toContain('UID:summer-cup-2026@belougatournament.ch\r\n')
    })

    it('includes DTSTAMP', () => {
      const ics = generateIcsContent(BASE_DATA)
      expect(ics).toMatch(/DTSTAMP:\d{8}T\d{6}Z\r\n/)
    })

    it('includes tournament URL', () => {
      const ics = generateIcsContent(BASE_DATA)
      expect(ics).toContain(
        'URL:https://example.com/tournaments/summer-cup-2026\r\n',
      )
    })
  })

  describe('description', () => {
    it('includes games list', () => {
      const ics = generateIcsContent(BASE_DATA)
      expect(ics).toContain('Jeux : Valorant\\, Rocket League')
    })

    it('strips HTML from description', () => {
      const ics = generateIcsContent(BASE_DATA)
      expect(ics).toContain('Un tournoi incroyable !')
      expect(ics).not.toContain('<p>')
      expect(ics).not.toContain('<strong>')
    })

    it('includes tournament URL in description', () => {
      const ics = generateIcsContent(BASE_DATA)
      // Unfold continuation lines (CRLF + space) before matching
      const unfolded = ics.replace(/\r\n /g, '')
      const descLine = unfolded
        .split('\r\n')
        .find(l => l.startsWith('DESCRIPTION:'))
      expect(descLine).toContain("Plus d'infos")
      expect(descLine).toContain('https://example.com/tournaments/')
    })

    it('handles empty games array', () => {
      const data = { ...BASE_DATA, games: [] }
      const ics = generateIcsContent(data)
      expect(ics).not.toContain('Jeux :')
    })
  })

  describe('text escaping', () => {
    it('escapes commas in title', () => {
      const data = { ...BASE_DATA, title: 'Cup, Summer Edition' }
      const ics = generateIcsContent(data)
      expect(ics).toContain('SUMMARY:Cup\\, Summer Edition')
    })

    it('escapes semicolons in title', () => {
      const data = { ...BASE_DATA, title: 'Cup; Finals' }
      const ics = generateIcsContent(data)
      expect(ics).toContain('SUMMARY:Cup\\; Finals')
    })

    it('escapes backslashes in title', () => {
      const data = { ...BASE_DATA, title: 'Cup \\ Edition' }
      const ics = generateIcsContent(data)
      expect(ics).toContain('SUMMARY:Cup \\\\ Edition')
    })
  })

  describe('date input formats', () => {
    it('accepts ISO string dates', () => {
      const data = {
        ...BASE_DATA,
        startDate: '2026-06-15T14:00:00.000Z',
        endDate: '2026-06-16T20:00:00.000Z',
      }
      const ics = generateIcsContent(data)
      expect(ics).toContain('DTSTART:20260615T140000Z')
      expect(ics).toContain('DTEND:20260616T200000Z')
    })
  })
})

describe('generateGoogleCalendarUrl', () => {
  it('returns a Google Calendar URL with correct params', () => {
    const url = generateGoogleCalendarUrl(BASE_DATA)
    expect(url).toContain('https://calendar.google.com/calendar/render')
    expect(url).toContain('action=TEMPLATE')
    expect(url).toContain('text=Summer+Cup+2026')
    expect(url).toContain('dates=20260615T140000Z%2F20260616T200000Z')
  })

  it('includes games and description in details param', () => {
    const url = generateGoogleCalendarUrl(BASE_DATA)
    const parsed = new URL(url)
    const details = parsed.searchParams.get('details') ?? ''
    expect(details).toContain('Jeux : Valorant, Rocket League')
    expect(details).toContain('Un tournoi incroyable !')
    expect(details).toContain('https://example.com/tournaments/')
  })

  it('handles empty games array', () => {
    const data = { ...BASE_DATA, games: [] }
    const url = generateGoogleCalendarUrl(data)
    const parsed = new URL(url)
    const details = parsed.searchParams.get('details') ?? ''
    expect(details).not.toContain('Jeux :')
  })
})

describe('generateOutlookCalendarUrl', () => {
  it('returns an Outlook URL with correct params', () => {
    const url = generateOutlookCalendarUrl(BASE_DATA)
    expect(url).toContain('https://outlook.live.com/calendar/0/action/compose')
    expect(url).toContain('rru=addevent')
    expect(url).toContain('subject=Summer+Cup+2026')
  })

  it('includes ISO date strings for start and end', () => {
    const url = generateOutlookCalendarUrl(BASE_DATA)
    const parsed = new URL(url)
    expect(parsed.searchParams.get('startdt')).toBe('2026-06-15T14:00:00.000Z')
    expect(parsed.searchParams.get('enddt')).toBe('2026-06-16T20:00:00.000Z')
  })

  it('accepts string dates', () => {
    const data = {
      ...BASE_DATA,
      startDate: '2026-06-15T14:00:00.000Z',
      endDate: '2026-06-16T20:00:00.000Z',
    }
    const url = generateOutlookCalendarUrl(data)
    const parsed = new URL(url)
    expect(parsed.searchParams.get('startdt')).toBe('2026-06-15T14:00:00.000Z')
    expect(parsed.searchParams.get('enddt')).toBe('2026-06-16T20:00:00.000Z')
  })

  it('includes description in body param', () => {
    const url = generateOutlookCalendarUrl(BASE_DATA)
    const parsed = new URL(url)
    const body = parsed.searchParams.get('body') ?? ''
    expect(body).toContain('Jeux : Valorant, Rocket League')
    expect(body).toContain('Un tournoi incroyable !')
  })
})

describe('downloadIcsFile', () => {
  const mockClick = vi.fn()
  const mockCreateObjectURL = vi.fn((_blob: Blob) => 'blob:mock-url')
  const mockRevokeObjectURL = vi.fn()
  const mockAppendChild = vi.fn()
  const mockRemoveChild = vi.fn()
  const mockCreateElement = vi.fn(() => ({
    href: '',
    download: '',
    click: mockClick,
  }))

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a blob, triggers download, and cleans up', () => {
    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    })
    vi.stubGlobal('document', {
      createElement: mockCreateElement,
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    })

    downloadIcsFile(BASE_DATA)

    expect(mockCreateObjectURL).toHaveBeenCalledOnce()
    const blob = mockCreateObjectURL.mock.calls[0][0]
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('text/calendar;charset=utf-8')

    expect(mockCreateElement).toHaveBeenCalledWith('a')
    const link = mockCreateElement.mock.results[0].value
    expect(link.href).toBe('blob:mock-url')
    expect(link.download).toBe('summer-cup-2026.ics')

    expect(mockAppendChild).toHaveBeenCalledWith(link)
    expect(mockClick).toHaveBeenCalledOnce()
    expect(mockRemoveChild).toHaveBeenCalledWith(link)
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})
