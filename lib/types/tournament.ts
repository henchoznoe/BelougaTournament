/**
 * File: lib/types/tournament.ts
 * Description: Barrel re-export for all tournament domain types.
 *   This file keeps existing import paths valid. New code should import directly
 *   from the relevant sub-file:
 *     - tournament-shared.ts  — UserSummary (used by both admin and public)
 *     - tournament-admin.ts   — admin list/detail, registrations, teams
 *     - tournament-public.ts  — public list/detail, hero badge, available teams
 *     - tournament-user.ts    — user registration state and profile history
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export * from './tournament-admin'
export * from './tournament-public'
export * from './tournament-shared'
export * from './tournament-user'
