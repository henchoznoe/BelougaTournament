import { CsvExportButton } from "@/components/admin/csv-export-button";

/**
 * File: app/admin/tournaments/[id]/page.tsx
 * Description: Tournament manager page for viewing details, managing registrations, and updating settings.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteRegistration, updateChallongeId } from "@/lib/actions/tournament-manager";
import { prisma } from "@/lib/prisma";
import { Eye, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";

async function getTournament(id: string) {
  return await prisma.tournament.findUnique({
    where: { id },
    include: {
      registrations: {
        orderBy: { createdAt: "desc" },
        include: {
          players: {
            include: {
              data: true,
            },
          },
        },
      },
      fields: true,
    },
  });
}

export default async function TournamentManagerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await getTournament(id);

  if (!tournament) {
    notFound();
  }

  const fillRate = tournament.maxParticipants
    ? Math.round((tournament.registrations.length / tournament.maxParticipants) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{tournament.title}</h1>
          <p className="text-zinc-400">Manage tournament details and registrations</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="registrants">Registrants ({tournament.registrations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-zinc-800 bg-zinc-950">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Fill Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{fillRate}%</div>
                <p className="text-xs text-zinc-500">
                  {tournament.registrations.length} / {tournament.maxParticipants || "∞"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-zinc-800 bg-zinc-950">
            <CardHeader>
              <CardTitle>Challonge Integration</CardTitle>
              <CardDescription>Enter the Challonge Tournament ID to embed the bracket on the public page.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateChallongeId.bind(null, tournament.id)} className="flex gap-4">
                <Input
                  name="challongeId"
                  placeholder="e.g. belouga_cup_1"
                  defaultValue={tournament.challongeId || ""}
                  className="max-w-md"
                />
                <Button type="submit">Save ID</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registrants" className="space-y-4">
          <div className="flex justify-end">
             <CsvExportButton data={tournament.registrations} fields={tournament.fields} />
          </div>

          <div className="rounded-md border border-zinc-800 bg-zinc-950">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                  <TableHead className="text-zinc-400">Name</TableHead>
                  <TableHead className="text-zinc-400">Contact</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Date</TableHead>
                  <TableHead className="text-right text-zinc-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournament.registrations.length > 0 ? (
                  tournament.registrations.map((reg) => (
                    <TableRow key={reg.id} className="border-zinc-800 hover:bg-zinc-900/50">
                      <TableCell className="font-medium text-white">
                        {reg.teamName || reg.players[0]?.nickname || "Unknown"}
                        {reg.players.length > 1 && <span className="ml-2 text-xs text-zinc-500">({reg.players.length} players)</span>}
                      </TableCell>
                      <TableCell className="text-zinc-300">{reg.contactEmail}</TableCell>
                      <TableCell className="text-zinc-300">{reg.status}</TableCell>
                      <TableCell className="text-zinc-300">
                        {new Date(reg.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="overflow-y-auto bg-zinc-950 border-zinc-800 text-zinc-50">
                              <SheetHeader>
                                <SheetTitle className="text-white">Registration Details</SheetTitle>
                                <SheetDescription>
                                  {reg.teamName || "Player Details"}
                                </SheetDescription>
                              </SheetHeader>
                              <div className="mt-6 space-y-6">
                                {reg.players.map((player) => (
                                  <div key={player.id} className="rounded-lg border border-zinc-800 p-4">
                                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                                      {player.nickname}
                                      {player.isCaptain && <span className="text-xs bg-blue-900 text-blue-200 px-2 py-0.5 rounded">Captain</span>}
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      {player.data.map((d) => {
                                        const fieldLabel = tournament.fields.find(f => f.id === d.tournamentFieldId)?.label || "Unknown Field";
                                        return (
                                          <div key={d.id} className="flex justify-between border-b border-zinc-800/50 pb-1 last:border-0">
                                            <span className="text-zinc-400">{fieldLabel}:</span>
                                            <span className="text-white font-medium">{d.value}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </SheetContent>
                          </Sheet>
                          
                          <form action={deleteRegistration.bind(null, reg.id, tournament.id)}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                      No registrations yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
