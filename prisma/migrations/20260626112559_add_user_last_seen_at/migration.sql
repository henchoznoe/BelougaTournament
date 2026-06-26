-- AlterTable
ALTER TABLE "user" ADD COLUMN     "lastSeenAt" TIMESTAMP(3);

-- Backfill last access from the last known login so the dashboard widget is not
-- empty for existing users on first deploy.
UPDATE "user" SET "lastSeenAt" = "lastLoginAt" WHERE "lastLoginAt" IS NOT NULL;
