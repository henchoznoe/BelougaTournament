/**
 * File: components/tournament/registration-form.tsx
 * Description: Form component for registering teams or players to a tournament with premium aesthetic.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { registerForTournament } from "@/lib/actions/registration";
import type { Prisma, TournamentField } from "@/prisma/generated/prisma/client";
import { TournamentFormat } from "@/prisma/generated/prisma/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Gamepad2, Mail, Plus, Trash2, Trophy, User, Users } from "lucide-react";
import { useActionState, useMemo } from "react";
import { Control, useFieldArray, useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";

// Types
type TournamentWithFields = Prisma.TournamentGetPayload<{
  include: { fields: { orderBy: { order: "asc" } } };
}>;

interface RegistrationFormProps {
  tournament: TournamentWithFields;
}

// Constants
const CONSTANTS = {
  ERRORS: {
    TEAM_NAME_REQUIRED: "Le nom d'équipe est requis",
    EMAIL_INVALID: "Adresse email invalide",
    NICKNAME_MIN: "Le pseudo doit contenir au moins 2 caractères",
    FIELD_REQUIRED: (label: string) => `${label} est requis`,
    NUMBER_REQUIRED: "Doit être un nombre",
  },
  LABELS: {
    TEAM_NAME: "Nom de l'équipe",
    CONTACT_EMAIL: "Email de contact",
    PLAYERS_SECTION: "Composition",
    PLAYER_DETAILS: "Détails du joueur",
    ADD_PLAYER: "Ajouter un joueur",
    PLAYER: "Joueur",
    CAPTAIN: "Capitaine",
    NICKNAME: "Pseudo",
    SUBMIT: "Confirmer l'inscription",
    SUBMITTING: "Inscription en cours...",
    TEAM_INFO_TITLE: "Informations de l'équipe",
    PLAYER_INFO_TITLE: "Informations du joueur",
  },
  PLACEHOLDERS: {
    TEAM_NAME: "Ex: Les Champions",
    EMAIL: "capitaine@exemple.com",
    NICKNAME: "Pseudo en jeu",
    SELECT: "Sélectionner...",
  },
} as const;

const createRegistrationSchema = (tournament: TournamentWithFields) => {
  const fieldSchema = z.object(
    tournament.fields.reduce((acc: Record<string, z.ZodTypeAny>, field: TournamentField) => {
      let validator: z.ZodString = z.string();

      if (field.required) {
        validator = validator.min(1, CONSTANTS.ERRORS.FIELD_REQUIRED(field.label));
      }

      let finalValidator: z.ZodTypeAny = validator;

      if (field.type === "NUMBER") {
        finalValidator = finalValidator.refine(
          (val) => !Number.isNaN(Number(val)),
          CONSTANTS.ERRORS.NUMBER_REQUIRED
        );
      }

      if (!field.required) {
        finalValidator = finalValidator.optional().or(z.literal(""));
      }

      acc[field.id] = finalValidator;
      return acc;
    }, {} as Record<string, z.ZodTypeAny>)
  );

  const playerSchema = z.object({
    nickname: z.string().min(2, CONSTANTS.ERRORS.NICKNAME_MIN),
    isCaptain: z.boolean(),
    data: fieldSchema,
  });

  return z.object({
    teamName:
      tournament.format === "TEAM"
        ? z.string().min(3, CONSTANTS.ERRORS.TEAM_NAME_REQUIRED)
        : z.string().optional(),
    contactEmail: z.string().email(CONSTANTS.ERRORS.EMAIL_INVALID),
    players: z.array(playerSchema).min(1),
  });
}

export const RegistrationForm = ({ tournament }: RegistrationFormProps) => {
  const [state, formAction, isPending] = useActionState(registerForTournament, {
    success: false,
    message: "",
    errors: {},
  });

  const formSchema = useMemo(() => createRegistrationSchema(tournament), [tournament]);

  type FormSchemaType = z.infer<typeof formSchema>;

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamName: "",
      contactEmail: "",
      players: Array.from({
        length: tournament.format === "SOLO" ? 1 : Math.max(1, tournament.teamSize),
      }).map((_, i) => ({
        nickname: "",
        isCaptain: i === 0,
        data: tournament.fields.reduce(
          (acc: Record<string, string>, field: TournamentField) => ({
            ...acc,
            [field.id]: "",
          }),
          {}
        ),
      })) as any,
    },
  });

  const { fields: playerFields, append, remove } = useFieldArray({
    control: form.control,
    name: "players",
  });

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-8">
        {state?.message && !state?.success && (
            <div className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {state.message}
            </div>
        )}

        <TeamInfoCard
          control={form.control}
          tournamentFormat={tournament.format}
          serverErrors={state?.errors}
        />

        <PlayersList
            control={form.control}
            playerFields={playerFields}
            append={append}
            remove={remove}
            tournament={tournament}
        />

        <Button
          type="submit"
          disabled={isPending}
          size="lg"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wide shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all duration-300"
        >
          {isPending ? CONSTANTS.LABELS.SUBMITTING : CONSTANTS.LABELS.SUBMIT}
        </Button>
      </form>
    </Form>
  );
}

interface TeamInfoCardProps {
  control: Control<any>;
  tournamentFormat: TournamentFormat;
  serverErrors?: { [key: string]: string[] };
}

const TeamInfoCard = ({ control, tournamentFormat, serverErrors }: TeamInfoCardProps) => {
  const isTeam = tournamentFormat === "TEAM";

  return (
    <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-lg overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-white">
          {isTeam ? (
            <Users className="size-5 text-blue-400" />
          ) : (
            <User className="size-5 text-blue-400" />
          )}
            {isTeam ? CONSTANTS.LABELS.TEAM_INFO_TITLE : CONSTANTS.LABELS.PLAYER_INFO_TITLE}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {isTeam && (
          <FormField
            control={control}
            name="teamName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    {CONSTANTS.LABELS.TEAM_NAME}
                </FormLabel>
                <FormControl>
                  <div className="relative group">
                    <Trophy className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-blue-400" />
                    <Input
                      placeholder={CONSTANTS.PLACEHOLDERS.TEAM_NAME}
                      {...field}
                      className="h-11 border-white/10 bg-zinc-950/50 pl-10 text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:bg-zinc-950/80 focus:ring-blue-500/20"
                    />
                  </div>
                </FormControl>
                <FormMessage />
                {serverErrors?.teamName && (
                  <p className="text-sm font-medium text-destructive">
                    {serverErrors.teamName[0]}
                  </p>
                )}
              </FormItem>
            )}
          />
        )}
        <FormField
          control={control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {CONSTANTS.LABELS.CONTACT_EMAIL}
              </FormLabel>
              <FormControl>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-blue-400" />
                  <Input
                    type="email"
                    placeholder={CONSTANTS.PLACEHOLDERS.EMAIL}
                    {...field}
                    className="h-11 border-white/10 bg-zinc-950/50 pl-10 text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:bg-zinc-950/80 focus:ring-blue-500/20"
                  />
                </div>
              </FormControl>
              <FormMessage />
              {serverErrors?.contactEmail && (
                <p className="text-sm font-medium text-destructive">
                  {serverErrors.contactEmail[0]}
                </p>
              )}
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

interface PlayersListProps {
    control: Control<any>;
    playerFields: any[]; // Using any[] from fieldArray generic output or specific type if accessible
    append: (value: any) => void;
    remove: (index: number) => void;
    tournament: TournamentWithFields;
}

function PlayersList({ control, playerFields, append, remove, tournament }: PlayersListProps) {
    const isTeam = tournament.format === "TEAM";

    const handleAddPlayer = () => {
        append({
            nickname: "",
            isCaptain: false,
            data: tournament.fields.reduce(
              (acc: Record<string, string>, field: TournamentField) => ({
                ...acc,
                [field.id]: "",
              }),
              {}
            ),
        });
    };

    return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Gamepad2 className="size-5 text-purple-400" />
              {isTeam ? CONSTANTS.LABELS.PLAYERS_SECTION : CONSTANTS.LABELS.PLAYER_DETAILS}
            </h3>
            {isTeam && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPlayer}
                className="border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600"
              >
                <Plus className="mr-2 h-4 w-4" /> {CONSTANTS.LABELS.ADD_PLAYER}
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
                    <PlayerCard
                        index={index}
                        control={control}
                        onRemove={() => remove(index)}
                        tournamentFields={tournament.fields}
                        isTeam={isTeam}
                    />
                </motion.div>
            ))}
          </AnimatePresence>
        </div>
    );
}

interface PlayerCardProps {
    index: number;
    control: Control<any>;
    onRemove: () => void;
    tournamentFields: TournamentField[];
    isTeam: boolean;
}

const PlayerCard = ({ index, control, onRemove, tournamentFields, isTeam }: PlayerCardProps) => {
    return (
        <Card className="border-white/10 bg-zinc-900/30 backdrop-blur-sm overflow-hidden group hover:border-white/20 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between py-4 bg-white/5">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-zinc-200">
                    <div className="flex size-6 items-center justify-center rounded bg-zinc-800 text-xs font-bold text-zinc-400">
                        {index + 1}
                    </div>
                    {CONSTANTS.LABELS.PLAYER} {index + 1}
                    {index === 0 && (
                        <span className="ml-2 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-300 ring-1 ring-blue-500/30">
                            {CONSTANTS.LABELS.CAPTAIN}
                        </span>
                    )}
                </CardTitle>
                {isTeam && index > 0 && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onRemove}
                        className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 pt-4">
                <FormField
                    control={control}
                    name={`players.${index}.nickname`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-zinc-500">{CONSTANTS.LABELS.NICKNAME}</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={CONSTANTS.PLACEHOLDERS.NICKNAME}
                                    {...field}
                                    className="border-white/10 bg-zinc-950/30 text-white placeholder:text-zinc-700 focus:border-blue-500/50 focus:bg-zinc-950/50"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Dynamic Fields Loop */}
                {tournamentFields.map((customField: TournamentField) => (
                    <FormField
                        key={customField.id}
                        control={control}
                        name={`players.${index}.data.${customField.id}`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs text-zinc-500">
                                    {customField.label}
                                    {customField.required && <span className="text-red-500 ml-1">*</span>}
                                </FormLabel>
                                <FormControl>
                                    {customField.type === "SELECT" ? (
                                        <Input
                                            {...field}
                                            value={field.value as string}
                                            placeholder={CONSTANTS.PLACEHOLDERS.SELECT}
                                            className="border-white/10 bg-zinc-950/30 text-white placeholder:text-zinc-700 focus:border-blue-500/50 focus:bg-zinc-950/50"
                                        />
                                    ) : customField.type === "CHECKBOX" ? (
                                        <div className="flex items-center h-10">
                                            <Checkbox
                                                name={field.name}
                                                value="true"
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
    );
}
