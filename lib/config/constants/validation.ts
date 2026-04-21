/**
 * File: lib/config/constants/validation.ts
 * Description: Validation limits, monetary bounds, and shared Zod/input constraints.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

/** Number of centimes in one currency unit (e.g. 100 centimes = 1 CHF). */
export const CENTIMES_PER_UNIT = 100

/** Entry fee amount bounds in centimes. */
export const ENTRY_FEE_MIN_AMOUNT = 100 // 1 CHF
export const ENTRY_FEE_MAX_AMOUNT = 100_000 // 1000 CHF

/** Shared validation limits used in Zod schemas and component maxLength attributes. */
export const VALIDATION_LIMITS = {
  TEAM_NAME_MIN: 2,
  TEAM_NAME_MAX: 30,
  DISPLAY_NAME_MIN: 2,
  DISPLAY_NAME_MAX: 32,
  TITLE_MAX: 200,
  SLUG_MAX: 200,
  DESCRIPTION_MAX: 15_000,
  RULES_MAX: 30_000,
  PRIZE_MAX: 5_000,
  GAME_MAX: 100,
  FIELD_LABEL_MAX: 100,
  FIELD_VALUE_MAX: 500,
  SPONSOR_NAME_MAX: 100,
  STAGE_NAME_MAX: 30,
  EXTERNAL_ID_MAX: 200,
  REFUND_DEADLINE_MIN_DAYS: 1,
  REFUND_DEADLINE_MAX_DAYS: 90,
  TEAM_SIZE_MIN: 1,
  TEAM_SIZE_MAX: 20,
  MAX_TEAMS_MIN: 2,
  RETURN_PATH_MAX: 500,
  SEARCH_QUERY_MAX: 100,
  FEATURE_TITLE_MAX: 50,
  FEATURE_DESCRIPTION_MAX: 200,
} as const
