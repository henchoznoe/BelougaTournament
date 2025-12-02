/**
 * File: app/admin/page.tsx
 * Description: Admin dashboard page displaying summary statistics and recent registrations.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { Calendar, Trophy, Users } from "lucide-react";

async function getStats() {
  const totalTournaments = await prisma.tournament.count();
  const activeTournaments = await prisma.tournament.count({
    where: {
      isArchived: false,
      endDate: { gte: new Date() },
    },
  });
  const totalRegistrations = await prisma.registration.count();

  const recentRegistrations = await prisma.registration.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      tournament: true,
      players: true,
    },
  });

  return {
    totalTournaments,
    activeTournaments,
    totalRegistrations,
    recentRegistrations,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Tournaments</CardTitle>
            <Trophy className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalTournaments}</div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Active Tournaments</CardTitle>
            <Calendar className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeTournaments}</div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalRegistrations}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Registrations */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Recent Registrations</h2>
        <div className="rounded-md border border-zinc-800 bg-zinc-950">
          {stats.recentRegistrations.length > 0 ? (
            <div className="divide-y divide-zinc-800">
              {stats.recentRegistrations.map((reg) => (
                <div key={reg.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-white">
                      {reg.teamName || reg.players[0]?.nickname || "Unknown"}
                    </p>
                    <p className="text-sm text-zinc-400">
                      Registered for <span className="text-blue-400">{reg.tournament.title}</span>
                    </p>
                  </div>
                  <div className="text-sm text-zinc-500">
                    {new Date(reg.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500">No registrations yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
