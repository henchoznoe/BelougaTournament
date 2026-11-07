/**
 * File: components/admin/dashboard/dashboard-payments.tsx
 * Description: Dashboard panel showing payment revenue stats and breakdown by tournament.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import {
  ArrowDownRight,
  Coins,
  CreditCard,
  HandHeart,
  PiggyBank,
  TrendingDown,
  Wallet,
} from 'lucide-react'
import { PendingLink as Link } from '@/components/ui/pending-link'
import { ROUTES } from '@/lib/config/routes'
import type { PaymentStats } from '@/lib/types/dashboard'
import { formatCentimes, pluralize } from '@/lib/utils/formatting'

interface DashboardPaymentsProps {
  payments: PaymentStats
}

export const DashboardPayments = ({ payments }: DashboardPaymentsProps) => {
  return (
    <div className="flex flex-col rounded-2xl border border-white/5 bg-white/2 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Wallet className="size-4 text-amber-400" />
        <h2 className="text-sm font-semibold text-white">Finances</h2>
      </div>

      {/* KPI cards — row 1: gross, refunds, net capital */}
      <div className="mb-3 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-white/2 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <CreditCard className="size-3" />
            Total encaissé
          </div>
          <p className="mt-1 text-lg font-semibold text-emerald-400">
            {formatCentimes(payments.totalRevenue)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {payments.transactionCount} paiement
            {pluralize(payments.transactionCount)}
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/2 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ArrowDownRight className="size-3" />
            Remboursé
          </div>
          <p className="mt-1 text-lg font-semibold text-red-400">
            {formatCentimes(payments.totalRefunded)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {payments.refundCount} remboursement
            {pluralize(payments.refundCount)}
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/2 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <PiggyBank className="size-3" />
            Capital net Belouga
          </div>
          <p className="mt-1 text-lg font-semibold text-white">
            {formatCentimes(payments.netRevenue)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            après remboursements et frais
          </p>
        </div>
      </div>

      {/* KPI cards — row 2: donations, forfeits, Stripe fees */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-white/2 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <HandHeart className="size-3" />
            Dons
          </div>
          <p className="mt-1 text-lg font-semibold text-violet-400">
            {formatCentimes(payments.totalDonations)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {payments.donationCount} don{pluralize(payments.donationCount)}{' '}
            volontaire{pluralize(payments.donationCount)}
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/2 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Coins className="size-3" />
            Frais conservés
          </div>
          <p className="mt-1 text-lg font-semibold text-orange-400">
            {formatCentimes(payments.totalForfeited)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {payments.forfeitedCount} forfait
            {pluralize(payments.forfeitedCount)}
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/2 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <TrendingDown className="size-3" />
            Frais Stripe
          </div>
          <p className="mt-1 text-lg font-semibold text-amber-400">
            {formatCentimes(payments.totalStripeFees)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">coûts de transaction</p>
        </div>
      </div>

      {/* Breakdown by tournament */}
      {payments.byTournament.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-400">
          Aucun revenu enregistré.
        </p>
      ) : (
        <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
          {payments.byTournament.map(t => (
            <Link
              key={t.id}
              href={ROUTES.ADMIN_TOURNAMENT_DETAIL(t.slug)}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/2 px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {t.title}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {t.paidCount} paiement{pluralize(t.paidCount)}
                  {t.refundedCount > 0 && (
                    <span className="text-red-400/70">
                      {' '}
                      · {t.refundedCount} remboursement
                      {pluralize(t.refundedCount)}
                    </span>
                  )}
                  {t.forfeitedCount > 0 && (
                    <span className="text-orange-400/70">
                      {' '}
                      · {t.forfeitedCount} forfait
                      {pluralize(t.forfeitedCount)}
                    </span>
                  )}
                  {t.donationCount > 0 && (
                    <span className="text-violet-400/70">
                      {' '}
                      · {t.donationCount} don{pluralize(t.donationCount)}
                    </span>
                  )}
                </p>
              </div>
              <div className="ml-4 shrink-0 text-right">
                <p className="text-sm font-medium text-emerald-400">
                  {formatCentimes(t.revenue)}
                </p>
                {t.refunded > 0 && (
                  <p className="text-xs text-red-400/70">
                    -{formatCentimes(t.refunded)}
                  </p>
                )}
                {t.forfeited > 0 && (
                  <p className="text-xs text-orange-400/70">
                    {formatCentimes(t.forfeited)} conservés
                  </p>
                )}
                {t.donations > 0 && (
                  <p className="text-xs text-violet-400/70">
                    +{formatCentimes(t.donations)} dons
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
