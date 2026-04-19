-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "teamLogoEnabled" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "imageUrls" DROP DEFAULT;

-- AlterTable
ALTER TABLE "team" ADD COLUMN     "logoUrl" TEXT;
