-- CreateEnum
CREATE TYPE "RegistrationType" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NOT_REQUIRED', 'UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RefundPolicyType" AS ENUM ('NONE', 'BEFORE_DEADLINE');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE');

-- DropForeignKey
ALTER TABLE "tournament_registration" DROP CONSTRAINT "tournament_registration_teamId_fkey";

-- DropIndex
DROP INDEX "tournament_registration_teamId_key";

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "entryFeeAmount" INTEGER,
ADD COLUMN     "entryFeeCurrency" TEXT,
ADD COLUMN     "refundDeadlineDays" INTEGER,
ADD COLUMN     "refundPolicyType" "RefundPolicyType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "registrationType" "RegistrationType" NOT NULL DEFAULT 'FREE';

-- AlterTable
ALTER TABLE "tournament_registration" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "entryFeeAmountSnapshot" INTEGER,
ADD COLUMN     "entryFeeCurrencySnapshot" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "paymentRequiredSnapshot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN     "refundDeadlineDaysSnapshot" INTEGER,
ADD COLUMN     "status" "RegistrationStatus" NOT NULL DEFAULT 'CONFIRMED';

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "stripeCustomerId" TEXT,
    "refundAmount" INTEGER,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_webhook_event" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_stripeCheckoutSessionId_key" ON "payment"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_stripePaymentIntentId_key" ON "payment"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_stripeChargeId_key" ON "payment"("stripeChargeId");

-- CreateIndex
CREATE INDEX "payment_registrationId_status_idx" ON "payment"("registrationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_webhook_event_stripeEventId_key" ON "stripe_webhook_event"("stripeEventId");

-- CreateIndex
CREATE INDEX "stripe_webhook_event_type_processedAt_idx" ON "stripe_webhook_event"("type", "processedAt");

-- CreateIndex
CREATE INDEX "tournament_registration_status_expiresAt_idx" ON "tournament_registration"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "tournament_registration" ADD CONSTRAINT "tournament_registration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "tournament_registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
