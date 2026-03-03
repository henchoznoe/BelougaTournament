-- AlterTable: Add displayName column, defaulting to name for existing rows
ALTER TABLE "user" ADD COLUMN "displayName" TEXT;
UPDATE "user" SET "displayName" = "name" WHERE "displayName" IS NULL;
ALTER TABLE "user" ALTER COLUMN "displayName" SET NOT NULL;
