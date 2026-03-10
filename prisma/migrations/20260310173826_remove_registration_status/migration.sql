-- AlterTable
ALTER TABLE "Tournament" DROP COLUMN "autoApprove";

-- AlterTable
ALTER TABLE "tournament_registration" DROP COLUMN "status";

-- DropEnum
DROP TYPE "RegistrationStatus";
