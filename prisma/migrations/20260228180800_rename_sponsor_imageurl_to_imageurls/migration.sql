/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `sponsor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sponsor" DROP COLUMN "imageUrl",
ADD COLUMN     "imageUrls" TEXT[];
