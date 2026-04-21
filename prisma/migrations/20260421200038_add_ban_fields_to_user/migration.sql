-- AlterTable
ALTER TABLE "Tournament" ALTER COLUMN "games" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "bannedUntil" TIMESTAMP(3);
