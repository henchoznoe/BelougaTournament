/**
 * File: lib/utils/countdown.ts
 * Description: Helpers to compute and format a human-readable countdown to a target date.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export interface CountdownParts {
  /** Raw remaining milliseconds (can be negative when the target is in the past). */
  totalMs: number
  days: number
  hours: number
  minutes: number
}

const MS_PER_MINUTE = 60_000
const MINUTES_PER_HOUR = 60
const MINUTES_PER_DAY = 1_440

/** Breaks the time remaining until `target` into day/hour/minute parts (clamped at zero). */
export const getCountdownParts = (
  target: Date | string | number,
  now: Date = new Date(),
): CountdownParts => {
  const totalMs = new Date(target).getTime() - now.getTime()
  const totalMinutes = Math.floor(Math.max(0, totalMs) / MS_PER_MINUTE)

  return {
    totalMs,
    days: Math.floor(totalMinutes / MINUTES_PER_DAY),
    hours: Math.floor((totalMinutes % MINUTES_PER_DAY) / MINUTES_PER_HOUR),
    minutes: totalMinutes % MINUTES_PER_HOUR,
  }
}

/**
 * Formats the remaining time as a short French label (e.g. "3j 4h", "5h 12min",
 * "8min"). Returns null when the target has already passed.
 */
export const formatCountdownShort = (
  target: Date | string | number,
  now: Date = new Date(),
): string | null => {
  const { totalMs, days, hours, minutes } = getCountdownParts(target, now)

  if (totalMs <= 0) {
    return null
  }

  if (days >= 1) {
    return `${days}j ${hours}h`
  }

  if (hours >= 1) {
    return `${hours}h ${minutes}min`
  }

  return `${minutes}min`
}
