/**
 * File: components/tournament/registration-form.tsx
 * Description: Form component for registering teams or players to a tournament with premium aesthetic.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { registerForTournament } from "@/lib/actions/registration";
import { zodResolver } from "@hookform/resolvers/zod";
import { Prisma } from "@prisma/client";
import { Plus, Trash2, User, Mail, Gamepad2, Users, Trophy } from "lucide-react";
import { useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

type TournamentWithFields = Prisma.TournamentGetPayload<{
  include: { fields: { orderBy: { order: "asc" } } };
}>;

interface RegistrationFormProps {
  tournament: TournamentWithFields;
}

export function RegistrationForm({ tournament }: RegistrationFormProps) {
  // 1. Generate Zod Schema dynamically based on tournament fields and format
  const formSchema = useMemo(() => {
    const fieldSchema = z.object(
      tournament.fields.reduce((acc, field) => {
        let validator: any = z.string();

        if (field.type === "NUMBER") {
          validator = z.string().refine((val) => !Number.isNaN(Number(val)), "Doit être un nombre");
        }

        if (field.required) {
          validator = validator.min(1, `${field.label} est requis`);
        } else {
          validator = validator.optional().or(z.literal(""));
        }

        acc[field.id] = validator;
        return acc;
      }, {} as Record<string, z.ZodTypeAny>)
    );

    const playerSchema = z.object({
      nickname: z.string().min(2, "Le pseudo doit contenir au moins 2 caractères"),
      isCaptain: z.boolean().default(false),
      data: fieldSchema,
    });

    return z.object({
      teamName: tournament.format === "TEAM"
        ? z.string().min(3, "Le nom d'équipe est requis")
        : z.string().optional(),
      contactEmail: z.string().email("Adresse email invalide"),
      players: z.array(playerSchema).min(1),
    });
  }, [tournament]);

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamName: "",
      contactEmail: "",
      players: Array.from({ length: tournament.format === "SOLO" ? 1 : Math.max(1, tournament.teamSize) }).map((_, i) => ({
        nickname: "",
        isCaptain: i === 0,
        data: tournament.fields.reduce((acc, field) => ({ ...acc, [field.id]: "" }), {}),
      })),
    },
  });

  const { fields: playerFields, append, remove } = useFieldArray({
    control: form.control,
    name: "players",
  });

  async function onSubmit(values: FormValues) {
    const payload = {
      tournamentId: tournament.id,
      teamName: values.teamName,
      contactEmail: values.contactEmail,
      players: values.players.map(p => ({
        nickname: p.nickname,
        isCaptain: p.isCaptain,
        data: p.data as Record<string, string>,
      })),
    };

    await registerForTournament(payload);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Team/Contact Info Card */}
        <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-lg overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              {tournament.format === "TEAM" ? <Users className="size-5 text-blue-400" /> : <User className="size-5 text-blue-400" />}
              {tournament.format === "TEAM" ? "Informations de l'équipe" : "Informations du joueur"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {tournament.format === "TEAM" && (
              <FormField
                control={form.control}
                name="teamName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wider text-zinc-500">Nom de l'équipe</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Trophy className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-blue-400" />
                        <Input
                            placeholder="Ex: Les Champions"
                            {...field}
                            className="h-11 border-white/10 bg-zinc-950/50 pl-10 text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:bg-zinc-950/80 focus:ring-blue-500/20"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium uppercase tracking-wider text-zinc-500">Email de contact</FormLabel>
                  <FormControl>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-blue-400" />
                        <Input
                            type="email"
                            placeholder="capitaine@exemple.com"
                            {...field}
                            className="h-11 border-white/10 bg-zinc-950/50 pl-10 text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:bg-zinc-950/80 focus:ring-blue-500/20"
                        />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Players List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Gamepad2 className="size-5 text-purple-400" />
              {tournament.format === "TEAM" ? "Composition" : "Détails du joueur"}
            </h3>
            {tournament.format === "TEAM" && (
               <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({
                 nickname: "",
                 isCaptain: false,
                 data: tournament.fields.reduce((acc, field) => ({ ...acc, [field.id]: "" }), {})
               })}
               className="border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600"
               >
                <Plus className="mr-2 h-4 w-4" /> Ajouter un joueur
              </Button>
            )}
          </div>

          <AnimatePresence>
            {playerFields.map((playerField, index) => (
                <motion.div
                    key={playerField.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                >
                    <Card className="border-white/10 bg-zinc-900/30 backdrop-blur-sm overflow-hidden group hover:border-white/20 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between py-4 bg-white/5">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-zinc-200">
                        <div className="flex size-6 items-center justify-center rounded bg-zinc-800 text-xs font-bold text-zinc-400">
                            {index + 1}
                        </div>
                        Joueur {index + 1}
                        {index === 0 && <span className="ml-2 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-300 ring-1 ring-blue-500/30">Capitaine</span>}
                        </CardTitle>
                        {tournament.format === "TEAM" && index > 0 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 transition-colors"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        )}
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 pt-4">
                        <FormField
                        control={form.control}
                        name={`players.${index}.nickname`}
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs text-zinc-500">Pseudo</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Pseudo en jeu"
                                    {...field}
                                    className="border-white/10 bg-zinc-950/30 text-white placeholder:text-zinc-700 focus:border-blue-500/50 focus:bg-zinc-950/50"
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />

                        {/* Dynamic Fields Loop */}
                        {tournament.fields.map((customField) => (
                        <FormField
                            key={customField.id}
                            control={form.control}
                            name={`players.${index}.data.${customField.id}`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs text-zinc-500">
                                {customField.label}
                                {customField.required && <span className="text-red-500 ml-1">*</span>}
                                </FormLabel>
                                <FormControl>
                                {customField.type === "SELECT" ? (
                                    <Input {...field} value={field.value as string} placeholder="Sélectionner..." className="border-white/10 bg-zinc-950/30 text-white placeholder:text-zinc-700 focus:border-blue-500/50 focus:bg-zinc-950/50" />
                                ) : customField.type === "CHECKBOX" ? (
                                    <div className="flex items-center h-10">
                                        <Checkbox
                                            checked={field.value === "true"}
                                            onCheckedChange={(c) => field.onChange(String(c))}
                                            className="border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                        />
                                    </div>
                                ) : (
                                    <Input
                                        {...field}
                                        value={field.value as string | number}
                                        type={customField.type === "NUMBER" ? "number" : "text"}
                                        className="border-white/10 bg-zinc-950/30 text-white placeholder:text-zinc-700 focus:border-blue-500/50 focus:bg-zinc-950/50"
                                    />
                                )}
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        ))}
                    </CardContent>
                    </Card>
                </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <Button
            type="submit"
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wide shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all duration-300"
        >
          Confirmer l'inscription
        </Button>
      </form>
    </Form>
  );
}
