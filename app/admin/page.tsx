/**
 * File: app/admin/page.tsx
 * Description: Admin dashboard page displaying summary statistics and recent registrations.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

import {
  Activity,
  ArrowUpRight,
  Calendar,
  Lock,
  type LucideIcon,
  Settings,
  Trophy,
  UserCheck,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Role } from '@/prisma/generated/prisma/enums'

// Types
type DashboardStats = {
  activeTournaments: number
  totalTournaments: number
  pendingRegistrations: number
  approvedRegistrations: number
  totalParticipants: number
  totalAdmins: number
  recentRegistrations: Array<{
    id: string
    status: string
    createdAt: Date
    teamName: string | null
    tournamentId: string
    tournament: { title: string }
    players: Array<{ nickname: string }>
  }>
}

interface QuickActionProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
  requiredRole?: Role
  currentRole?: Role
  colors: {
    bg: string
    text: string
    hoverBg: string
    hoverBorder: string
  }
}

// Constants
const CONTENT = {
  TITLE: 'Tableau de bord',
  SUBTITLE: "Vue d'ensemble de votre plateforme de tournois.",
  BTN_NEW_TOURNAMENT: 'Créer un Tournoi',
  SECTION_ACTIVITY: 'Activité Récente',
  SECTION_ACTIONS: 'Actions Rapides',
  EMPTY_ACTIVITY: 'Aucune activité récente.',
  LOCKED_LABEL: 'Réservé aux SuperAdmins',
  STATS: {
    ACTIVE: 'Tournois Actifs',
    PENDING: 'Inscriptions en attente',
    PARTICIPANTS: 'Total Participants',
    ADMINS: 'Total Administrateurs',
  },
} as const

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const [
    totalTournaments,
    activeTournaments,
    pendingRegistrations,
    approvedRegistrations,
    totalAdmins,
    totalParticipants,
    recentRegistrations,
  ] = await Promise.all([
    prisma.tournament.count(),
    prisma.tournament.count({ where: { isArchived: false } }),
    prisma.registration.count({ where: { status: 'PENDING' } }),
    prisma.registration.count({ where: { status: 'APPROVED' } }),
    prisma.user.count(),
    prisma.player.count(),
    prisma.registration.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        tournament: { select: { title: true } },
        players: { select: { nickname: true }, take: 1 },
      },
    }),
  ])

  return {
    totalTournaments,
    activeTournaments,
    pendingRegistrations,
    approvedRegistrations,
    totalAdmins,
    totalParticipants,
    recentRegistrations,
  }
}

const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  colorClass,
}: {
  title: string
  value: number | string
  subtext: React.ReactNode
  icon: LucideIcon
  colorClass: string
}) => {
  return (
    <Card className="border-white/10 bg-zinc-900/50 shadow-xl backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">
          {title}
        </CardTitle>
        <div
          className={`flex size-8 items-center justify-center rounded-lg bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}
        >
          <Icon className={`size-4 ${colorClass}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        <p className="mt-1 text-xs text-zinc-500">{subtext}</p>
      </CardContent>
    </Card>
  )
}

/**
 * Renders a quick action button.
 * Handles the "Locked" state if the user doesn't have the required role.
 */
const QuickActionButton = ({
  title,
  description,
  icon: Icon,
  href,
  requiredRole,
  currentRole,
  colors,
}: QuickActionProps) => {
  const isLocked = requiredRole && currentRole !== requiredRole

  if (isLocked) {
    return (
      <div className="group relative cursor-not-allowed opacity-50">
        <Button
          variant="outline"
          className="h-16 w-full justify-start border-white/5 bg-zinc-900/20 text-zinc-600"
          disabled
        >
          <div className="mr-4 flex size-10 items-center justify-center rounded bg-zinc-800/50">
            <Lock className="size-5 text-zinc-600" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-base font-medium">{title}</span>
            <span className="text-xs text-zinc-600">
              {CONTENT.LOCKED_LABEL}
            </span>
          </div>
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      className={`group h-16 w-full justify-start border-white/5 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white ${colors.hoverBorder}`}
      asChild
    >
      <Link href={href}>
        <div
          className={`mr-4 flex size-10 items-center justify-center rounded bg-opacity-10 transition-colors ${colors.bg} ${colors.hoverBg}`}
        >
          <Icon className={`size-5 ${colors.text}`} />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-base font-medium">{title}</span>
          <span className="text-xs text-zinc-500">{description}</span>
        </div>
      </Link>
    </Button>
  )
}

/**
 * Renders a single row in the recent activity list.
 */
const RecentActivityItem = ({
  registration,
}: {
  registration: DashboardStats['recentRegistrations'][0]
}) => {
  const name = registration.teamName || registration.players[0]?.nickname || '?'
  const initial = name.charAt(0).toUpperCase()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="h-5 px-1.5 text-[10px]">APPROUVÉ</Badge>
      case 'PENDING':
        return (
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            EN ATTENTE
          </Badge>
        )
      default:
        return (
          <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
            REFUSÉ
          </Badge>
        )
    }
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:border-white/10">
      <div className="flex items-center gap-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-800 font-bold text-zinc-400">
          {initial}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-white">{name}</p>
            {getStatusBadge(registration.status)}
          </div>
          <p className="flex items-center gap-1 text-xs text-zinc-400">
            Inscrit au tournoi
            <span className="font-medium text-blue-400">
              {registration.tournament.title}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <Calendar className="size-3" />
          {new Date(registration.createdAt).toLocaleDateString('fr-FR')}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[10px] text-zinc-400 hover:bg-white/10 hover:text-white"
          asChild
        >
          <Link href={`/admin/tournaments/${registration.tournamentId}`}>
            Voir <ArrowUpRight className="ml-1 size-3" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default async function AdminDashboard() {
  const session = await getSession()
  const stats = await fetchDashboardStats()
  const userRole = session?.user?.role

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 text-4xl font-black tracking-tighter text-white">
            {CONTENT.TITLE}
          </h1>
          <p className="text-zinc-400">{CONTENT.SUBTITLE}</p>
        </div>
        <Button
          asChild
          size="lg"
          className="bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500"
        >
          <Link href="/admin/tournaments/new">
            <Trophy className="mr-2 h-5 w-5" />
            {CONTENT.BTN_NEW_TOURNAMENT}
          </Link>
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={CONTENT.STATS.ACTIVE}
          value={stats.activeTournaments}
          icon={Trophy}
          colorClass="text-blue-500"
          subtext={`Sur ${stats.totalTournaments} tournois au total`}
        />
        <StatCard
          title={CONTENT.STATS.PENDING}
          value={stats.pendingRegistrations}
          icon={Users}
          colorClass="text-yellow-500"
          subtext={
            <span>
              <span className="font-medium text-green-500">
                {stats.approvedRegistrations}
              </span>{' '}
              Approuvées
            </span>
          }
        />
        <StatCard
          title={CONTENT.STATS.PARTICIPANTS}
          value={stats.totalParticipants}
          icon={UserCheck}
          colorClass="text-emerald-500"
          subtext="Joueurs uniques"
        />
        <StatCard
          title={CONTENT.STATS.ADMINS}
          value={stats.totalAdmins}
          icon={Activity}
          colorClass="text-purple-500"
          subtext="Gestionnaires du site"
        />
      </div>

      {/* Activity & Actions Grid */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Recent Activity Panel */}
        <Card className="col-span-4 border-white/10 bg-zinc-900/50 shadow-xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
              <Activity className="size-5 text-blue-500" />
              {CONTENT.SECTION_ACTIVITY}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentRegistrations.length > 0 ? (
              <div className="space-y-4">
                {stats.recentRegistrations.map(reg => (
                  <RecentActivityItem key={reg.id} registration={reg} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-zinc-500">
                <Activity className="size-8 opacity-20" />
                <p>{CONTENT.EMPTY_ACTIVITY}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Panel */}
        <Card className="col-span-3 border-white/10 bg-zinc-900/50 shadow-xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
              <Trophy className="size-5 text-yellow-500" />
              {CONTENT.SECTION_ACTIONS}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <QuickActionButton
              title="Gérer les Tournois"
              description="Créer, modifier et gérer"
              icon={Trophy}
              href="/admin/tournaments"
              currentRole={userRole}
              colors={{
                bg: 'bg-blue-500/10',
                text: 'text-blue-500',
                hoverBg: 'group-hover:bg-blue-500/20',
                hoverBorder: 'hover:border-blue-500/30',
              }}
            />

            <QuickActionButton
              title="Gérer les Admins"
              description="Comptes et accès"
              icon={Users}
              href="/admin/admins"
              requiredRole={Role.SUPERADMIN}
              currentRole={userRole}
              colors={{
                bg: 'bg-purple-500/10',
                text: 'text-purple-500',
                hoverBg: 'group-hover:bg-purple-500/20',
                hoverBorder: 'hover:border-purple-500/30',
              }}
            />

            <QuickActionButton
              title="Paramètres du Site"
              description="Configuration globale"
              icon={Settings}
              href="/admin/settings"
              requiredRole={Role.SUPERADMIN}
              currentRole={userRole}
              colors={{
                bg: 'bg-zinc-500/10',
                text: 'text-zinc-400',
                hoverBg: 'group-hover:bg-zinc-500/20',
                hoverBorder: 'hover:border-zinc-500/30',
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
