-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "showRegistrants" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;
