/**
 * File: components/admin/tournament-form/settings-section.tsx
 * Description: Form section for tournament settings (Format, Participants, Team Size).
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormContext } from "react-hook-form";

export function SettingsSection() {
  const { control } = useFormContext();

  return (
    <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
      <CardHeader>
        <CardTitle className="text-white">Format & Configuration</CardTitle>
        <CardDescription className="text-zinc-400">Structure et limites du tournoi.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField
            control={control}
            name="format"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-400">Format</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-zinc-900/50 border-white/10 text-white focus:ring-blue-500/20">
                      <SelectValue placeholder="Sélectionner le format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-zinc-950 border-white/10 text-white">
                    <SelectItem value="SOLO">Solo</SelectItem>
                    <SelectItem value="TEAM">Équipe</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="teamSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-400">Taille de l'équipe</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value} onChange={e => field.onChange(e.target.valueAsNumber || 0)} className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="maxParticipants"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-400">Participants Max</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value} onChange={e => field.onChange(e.target.valueAsNumber || 0)} className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
