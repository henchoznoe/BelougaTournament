/*
  Warnings:

  - You are about to drop the column `banReason` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `bannedUntil` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "banReason",
DROP COLUMN "bannedUntil";
