-- Migration: 20260420224500_add_stripe_fee_to_payment
-- Adds stripeFee column to the payment table to store the Stripe processing fee
-- (retrieved from balance_transaction.fee at checkout.session.completed webhook time).
-- Nullable to preserve compatibility with existing payment rows.

ALTER TABLE "payment" ADD COLUMN "stripeFee" INTEGER;
