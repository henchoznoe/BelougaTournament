/*
  Warnings:

  - You are about to drop the column `socials` on the `global_settings` table. All the data in the column will be lost.
  - You are about to drop the column `streamUrl` on the `global_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "global_settings" DROP COLUMN "socials",
DROP COLUMN "streamUrl",
ADD COLUMN     "discordUrl" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "tiktokUrl" TEXT,
ADD COLUMN     "twitchUrl" TEXT,
ADD COLUMN     "twitchUsername" TEXT,
ADD COLUMN     "youtubeUrl" TEXT;
