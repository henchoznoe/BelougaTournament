/**
 * File: components/admin/tournament-form.tsx
 * Description: Reusable form component for creating and editing tournaments.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2, Save } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { tournamentSchema } from "@/lib/schemas/tournament";

const formSchema = tournamentSchema;

import { useState } from "react";

type TournamentFormProps = {
  initialData?: z.infer<typeof formSchema>;
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<any>;
  submitLabel?: string;
};

export function TournamentForm({ initialData, onSubmit, submitLabel = "Créer le Tournoi" }: TournamentFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: "",
      slug: "",
      description: "",
      format: "SOLO",
      teamSize: 1,
      fields: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fields",
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setServerError(null);
    try {
      // Twitch Integration: Default streamUrl if empty
      if (!values.streamUrl || values.streamUrl.trim() === "") {
        values.streamUrl = "https://twitch.tv/quentadoulive";
      }

      const result = await onSubmit(values);
      if (result?.message) {
        setServerError(result.message);
      }
    } catch (error) {
      setServerError("Une erreur inattendue est survenue.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {serverError && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">
            {serverError}
          </div>
        )}
        <div className="grid gap-6">
            <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader>
                <CardTitle className="text-white">Informations Générales</CardTitle>
                <CardDescription className="text-zinc-400">Détails de base du tournoi.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-zinc-400">Titre</FormLabel>
                        <FormControl>
                        <Input placeholder="Belouga Cup #1" {...field} className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-zinc-400">Slug (URL)</FormLabel>
                        <FormControl>
                        <Input placeholder="belouga-cup-1" {...field} className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>

                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-zinc-400">Description</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Règles et détails du tournoi..." {...field} className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600 min-h-[100px]" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
            </Card>

            <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
                <CardHeader>
                    <CardTitle className="text-white">Dates & Horaires</CardTitle>
                    <CardDescription className="text-zinc-400">Planification du tournoi et des inscriptions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {[
                            { name: "startDate", label: "Date de début" },
                            { name: "endDate", label: "Date de fin" },
                            { name: "registrationOpen", label: "Ouverture des inscriptions" },
                            { name: "registrationClose", label: "Fermeture des inscriptions" }
                        ].map((dateField) => (
                            <FormField
                            key={dateField.name}
                            control={form.control}
                            name={dateField.name as any}
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel className="text-zinc-400">{dateField.label}</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal bg-zinc-900/50 border-white/10 hover:bg-white/5 hover:text-white text-white",
                                            !field.value && "text-zinc-500"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP", { locale: fr })
                                        ) : (
                                            <span>Choisir une date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-zinc-950 border-white/10" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                        date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                        className="bg-zinc-950 text-white"
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
                <CardHeader>
                    <CardTitle className="text-white">Format & Configuration</CardTitle>
                    <CardDescription className="text-zinc-400">Structure et limites du tournoi.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField
                        control={form.control}
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
                        control={form.control}
                        name="teamSize"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-zinc-400">Taille de l'équipe</FormLabel>
                            <FormControl>
                            <Input type="number" {...field} value={field.value as number} className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="maxParticipants"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-zinc-400">Participants Max</FormLabel>
                            <FormControl>
                            <Input type="number" {...field} value={field.value as number} className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                <CardTitle className="text-white">Champs d'Inscription</CardTitle>
                <CardDescription className="text-zinc-400">Définissez des champs dynamiques pour l'inscription des joueurs.</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ label: "", type: "TEXT", required: true })} className="border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un champ
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {fields.map((field, index) => (
                <div key={field.id} className="grid gap-4 p-4 rounded-lg border border-white/10 bg-black/20 md:grid-cols-[1fr,150px,auto,auto] items-end">
                    <FormField
                    control={form.control}
                    name={`fields.${index}.label`}
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-zinc-400">Label</FormLabel>
                        <FormControl>
                            <Input placeholder="ex: Rang, Pseudo Discord..." {...field} className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name={`fields.${index}.type`}
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-zinc-400">Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger className="bg-zinc-900/50 border-white/10 text-white focus:ring-blue-500/20">
                                <SelectValue />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-zinc-950 border-white/10 text-white">
                            <SelectItem value="TEXT">Texte</SelectItem>
                            <SelectItem value="NUMBER">Nombre</SelectItem>
                            <SelectItem value="SELECT">Sélection</SelectItem>
                            <SelectItem value="CHECKBOX">Case à cocher</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name={`fields.${index}.required`}
                    render={({ field }) => (
                        <FormItem className="flex flex-col items-center gap-3 pb-2">
                        <FormLabel className="text-zinc-400">Requis</FormLabel>
                        <FormControl>
                            <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                        </FormControl>
                        </FormItem>
                    )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500 hover:text-red-400 hover:bg-red-500/10 mb-0.5">
                    <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                ))}
                {fields.length === 0 && (
                <div className="py-8 text-center text-zinc-500 text-sm border border-dashed border-white/10 rounded-lg">
                    Aucun champ personnalisé ajouté.
                </div>
                )}
            </CardContent>
            </Card>

            <div className="flex justify-end">
            <Button
                type="submit"
                size="lg"
                className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
            >
                <Save className="mr-2 h-5 w-5" />
                {submitLabel}
            </Button>
            </div>
        </div>
      </form>
    </Form>
  );
}

