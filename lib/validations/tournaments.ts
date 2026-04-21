/**
 * File: lib/validations/tournaments.ts
 * Description: Barrel re-export for all tournament validation schemas.
 *   This file keeps existing import paths valid. New code should import directly
 *   from the relevant sub-file:
 *     - tournament-crud.ts         — admin CRUD schemas (create, update, delete, status)
 *     - tournament-registration.ts — player registration, team, and unregistration schemas
 *     - tournament-filters.ts      — public list filter types and parser
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export * from './tournament-crud'
export * from './tournament-filters'
export * from './tournament-registration'
