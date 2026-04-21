/**
 * File: lib/config/constants.ts
 * Description: Compatibility re-export — all constants now live in lib/config/constants/.
 *   This file keeps the legacy import path '@/lib/config/constants' working.
 *   Prefer importing from the specific sub-file when authoring new code:
 *     - constants/admin.ts   — admin UI, pagination, upload limits
 *     - constants/auth.ts    — session, rate limits, search
 *     - constants/cache.ts   — cache tag names
 *     - constants/site.ts    — branding, legal, third-party URLs
 *     - constants/timing.ts  — durations, delays
 *     - constants/validation.ts — Zod limits, monetary bounds
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export * from './constants/index'
