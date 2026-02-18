/*
  Warnings:

  - You are about to drop the column `statsMatches` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `statsPlayers` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `statsTournaments` on the `SiteSettings` table. All the data in the column will be lost.
  - You are about to drop the column `statsYears` on the `SiteSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SiteSettings" DROP COLUMN "statsMatches",
DROP COLUMN "statsPlayers",
DROP COLUMN "statsTournaments",
DROP COLUMN "statsYears";
