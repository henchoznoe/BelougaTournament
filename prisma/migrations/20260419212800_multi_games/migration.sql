-- Migration: multi_games
-- Replaces the nullable `game` column with a `games` text array.
-- Existing non-null game values are preserved by migrating them into the array.

-- Step 1: Add the new games column (empty array default)
ALTER TABLE "Tournament" ADD COLUMN "games" TEXT[] NOT NULL DEFAULT '{}';

-- Step 2: Migrate existing game values into the array (skips NULLs)
UPDATE "Tournament" SET "games" = ARRAY["game"] WHERE "game" IS NOT NULL;

-- Step 3: Drop the old game column
ALTER TABLE "Tournament" DROP COLUMN "game";
