/**
 * File: lib/config/constants/timing.ts
 * Description: Time durations, delays, and schedule-related constants.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

/** Common time durations in milliseconds. */
export const SECOND_IN_MS = 1000
export const MINUTE_IN_MS = SECOND_IN_MS * 60
const HOUR_IN_MS = MINUTE_IN_MS * 60
export const DAY_IN_MS = HOUR_IN_MS * 24

/** Minutes in one hour, used for sub-day time formatting. */
export const MINUTES_PER_HOUR = 60

/** Stripe slot hold duration in minutes — how long a registration is reserved during Stripe Checkout. */
export const REGISTRATION_HOLD_MINUTES = 30

/** Milliseconds to wait before assuming a Twitch channel is offline if no state event fires. */
export const TWITCH_FALLBACK_TIMEOUT_MS = 8000
