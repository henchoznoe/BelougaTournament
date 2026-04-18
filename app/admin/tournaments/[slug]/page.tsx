/**
 * File: app/admin/tournaments/[slug]/page.tsx
 * Description: Admin page for viewing tournament details (placeholder).
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { Trophy } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminContentLayout } from '@/components/admin/ui/admin-content-layout'
import { ROUTES } from '@/lib/config/routes'
import { getTournamentBySlug } from '@/lib/services/tournaments'

interface AdminTournamentDetailPageProps {
  params: Promise<{ slug: string }>
}

export const generateMetadata = async ({
  params,
}: AdminTournamentDetailPageProps): Promise<Metadata> => {
  const { slug } = await params
  const tournament = await getTournamentBySlug(slug)
  return {
    title: tournament ? tournament.title : 'Tournoi introuvable',
  }
}

const AdminTournamentDetailPage = async ({
  params,
}: AdminTournamentDetailPageProps) => {
  const { slug } = await params
  const tournament = await getTournamentBySlug(slug)

  if (!tournament) {
    notFound()
  }

  return (
    <AdminContentLayout
      segments={[
        { label: 'Tournois', href: ROUTES.ADMIN_TOURNAMENTS },
        { label: tournament.title },
      ]}
      icon={Trophy}
      title={tournament.title}
    >
      <div className="rounded-2xl border border-white/5 bg-white/2 p-8 text-center backdrop-blur-sm">
        <p className="text-sm text-zinc-500">
          La page de détail du tournoi sera implémentée prochainement.
        </p>
      </div>
    </AdminContentLayout>
  )
}

export default AdminTournamentDetailPage
