-- AlterEnum: remove WAITLIST from RegistrationStatus
-- First, convert any existing WAITLIST rows to PENDING
UPDATE "tournament_registration" SET "status" = 'PENDING' WHERE "status" = 'WAITLIST';

-- Drop default before changing type (Postgres requires this)
ALTER TABLE "tournament_registration" ALTER COLUMN "status" DROP DEFAULT;

-- Recreate the enum without WAITLIST
CREATE TYPE "RegistrationStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
ALTER TABLE "tournament_registration" ALTER COLUMN "status" TYPE "RegistrationStatus_new" USING ("status"::text::"RegistrationStatus_new");
ALTER TYPE "RegistrationStatus" RENAME TO "RegistrationStatus_old";
ALTER TYPE "RegistrationStatus_new" RENAME TO "RegistrationStatus";
DROP TYPE "RegistrationStatus_old";

-- Restore default
ALTER TABLE "tournament_registration" ALTER COLUMN "status" SET DEFAULT 'PENDING';
