-- CreateEnum
CREATE TYPE "DonationType" AS ENUM ('FIXED', 'FREE');

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "donationEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "donationFixedAmount" INTEGER,
ADD COLUMN     "donationMinAmount" INTEGER,
ADD COLUMN     "donationType" "DonationType";

-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "donationAmount" INTEGER;

-- AlterTable
ALTER TABLE "tournament_registration" ADD COLUMN     "donationAmountSnapshot" INTEGER;
