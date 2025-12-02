/**
 * File: components/tournament/registration-form.tsx
 * Description: Form component for registering teams or players to a tournament.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { registerForTournament } from "@/lib/actions/registration";
import { zodResolver } from "@hookform/resolvers/zod";
import { Prisma } from "@prisma/client";
import { Plus, Trash2, User } from "lucide-react";
import { useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

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
          validator = z.string().refine((val) => !Number.isNaN(Number(val)), "Must be a number");
        }
        
        if (field.required) {
          validator = validator.min(1, `${field.label} is required`);
        } else {
          validator = validator.optional().or(z.literal(""));
        }

        acc[field.id] = validator;
        return acc;
      }, {} as Record<string, z.ZodTypeAny>)
    );

    const playerSchema = z.object({
      nickname: z.string().min(2, "Nickname must be at least 2 characters"),
      isCaptain: z.boolean().default(false),
      data: fieldSchema,
    });

    return z.object({
      teamName: tournament.format === "TEAM" 
        ? z.string().min(3, "Team name is required") 
        : z.string().optional(),
      contactEmail: z.string().email("Invalid email address"),
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
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle>Registration Details</CardTitle>
            <CardDescription>
              {tournament.format === "TEAM" ? "Team Information" : "Player Information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tournament.format === "TEAM" && (
              <FormField
                control={form.control}
                name="teamName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. The Champions" {...field} />
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
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="captain@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {tournament.format === "TEAM" ? "Roster" : "Player Details"}
            </h3>
            {tournament.format === "TEAM" && (
               <Button type="button" variant="outline" size="sm" onClick={() => append({ 
                 nickname: "", 
                 isCaptain: false, 
                 data: tournament.fields.reduce((acc, field) => ({ ...acc, [field.id]: "" }), {}) 
               })}>
                <Plus className="mr-2 h-4 w-4" /> Add Player
              </Button>
            )}
          </div>

          {playerFields.map((playerField, index) => (
            <Card key={playerField.id} className="border-zinc-800 bg-zinc-900">
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  Player {index + 1}
                  {index === 0 && <span className="ml-2 rounded bg-blue-900/50 px-2 py-0.5 text-xs text-blue-200">Captain</span>}
                </CardTitle>
                {tournament.format === "TEAM" && index > 0 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500 hover:text-red-400 h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`players.${index}.nickname`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nickname</FormLabel>
                      <FormControl>
                        <Input placeholder="In-game Name" {...field} />
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
                        <FormLabel>
                          {customField.label}
                          {customField.required && <span className="text-red-500 ml-1">*</span>}
                        </FormLabel>
                        <FormControl>
                          {customField.type === "SELECT" ? (
                             <Input {...field} value={field.value as string} placeholder="Select not impl yet" /> // Placeholder for select logic if needed
                          ) : customField.type === "CHECKBOX" ? (
                             <Checkbox checked={field.value === "true"} onCheckedChange={(c) => field.onChange(String(c))} />
                          ) : (
                             <Input {...field} value={field.value as string | number} type={customField.type === "NUMBER" ? "number" : "text"} />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
          Complete Registration
        </Button>
      </form>
    </Form>
  );
}
