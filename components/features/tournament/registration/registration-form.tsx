/**
 * File: components/features/tournament/registration/registration-form.tsx
 * Description: Form component for registering teams or players to a tournament with premium aesthetic.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

'use client'

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  type RegistrationState,
  registerForTournament,
} from '@/lib/actions/registration'
import { fr } from "@/lib/i18n/dictionaries/fr"
import type {
  Prisma,
  TournamentField,
} from '@/prisma/generated/prisma/client'
import type { TournamentFormat } from '@/prisma/generated/prisma/enums'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Gamepad2,
  Mail,
  Plus,
  Trash2,
  Trophy,
  User,
  Users,
} from 'lucide-react'
import { useActionState, useMemo } from 'react'
import {
  type Control,
  type UseFormReturn,
  useFieldArray,
  useForm,
} from 'react-hook-form'
import { z } from 'zod'

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

type TournamentWithFields = Prisma.TournamentGetPayload<{
  include: { fields: { orderBy: { order: 'asc' } } }
}>

interface RegistrationFormProps {
  tournament: TournamentWithFields
}

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------



// ----------------------------------------------------------------------
// LOGIC
// ----------------------------------------------------------------------

const createRegistrationSchema = (tournament: TournamentWithFields) => {
  const fieldSchema = z.object(
    tournament.fields.reduce(
      (acc: Record<string, z.ZodTypeAny>, field: TournamentField) => {
        let validator: z.ZodString = z.string()

        if (field.required) {
          validator = validator.min(
            1,
            fr.pages.admin.registration.errors.fieldRequired(field.label),
          )
        }

        let finalValidator: z.ZodTypeAny = validator

        if (field.type === 'NUMBER') {
          finalValidator = finalValidator.refine(
            (val) => !Number.isNaN(Number(val)),
            fr.pages.admin.registration.errors.numberRequired,
          )
        }

        if (!field.required) {
          finalValidator = finalValidator.optional().or(z.literal(''))
        }

        acc[field.id] = finalValidator
        return acc
      },
      {} as Record<string, z.ZodTypeAny>,
    ),
  )

  const playerSchema = z.object({
    nickname: z.string().min(2, fr.pages.admin.registration.errors.nicknameMin),
    isCaptain: z.boolean(),
    data: fieldSchema,
  })

  return z.object({
    teamName:
      tournament.format === 'TEAM'
        ? z.string().min(3, fr.pages.admin.registration.errors.teamNameRequired)
        : z.string().optional(),
    contactEmail: z.string().email(fr.pages.admin.registration.errors.emailInvalid),
    players: z.array(playerSchema).min(1),
  })
}

// We define a type helper to extract the inferred Type from the schema function return
// This is dynamic based on the tournament, so strictly speaking the static type `FormValues`
// below is a generalization.
// Zod .optional() creates { key: T | undefined }, not { key?: T }.
interface FormValues {
  teamName: string | undefined
  contactEmail: string
  players: {
    nickname: string
    isCaptain: boolean
    data: Record<string, string>
  }[]
}

export const RegistrationForm = ({ tournament }: RegistrationFormProps) => {
  const [state, formAction, isPending] = useActionState(registerForTournament, {
    success: false,
    message: '',
    errors: {},
  })

  const formSchema = useMemo(
    () => createRegistrationSchema(tournament),
    [tournament],
  )

  // Explicitly cast the resolver to avoid conditional type mismatches
  // biome-ignore lint/suspicious/noExplicitAny: Zod schema is dynamic
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      teamName: '',
      contactEmail: '',
      players: Array.from({
        length:
          tournament.format === 'SOLO' ? 1 : Math.max(1, tournament.teamSize),
      }).map((_, i) => ({
        nickname: '',
        isCaptain: i === 0,
        data: tournament.fields.reduce(
          (acc: Record<string, string>, field: TournamentField) => ({
            ...acc,
            [field.id]: '',
          }),
          {},
        ),
      })),
    },
  })

  // biome-ignore lint/suspicious/noExplicitAny: Control type complexity
  const control = form.control as Control<any>

  const {
    fields: playerFields,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    name: 'players',
  })

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-8">
        {state?.message && !state?.success && (
          <div className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {state.message}
          </div>
        )}

        <input type="hidden" name="tournamentId" value={tournament.id} />

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
          {isPending ? fr.pages.admin.registration.labels.submitting : fr.pages.admin.registration.labels.submit}
        </Button>
      </form>
    </Form>
  )
}

interface TeamInfoCardProps {
  control: Control<FormValues>
  tournamentFormat: TournamentFormat
  serverErrors?: { [key: string]: string[] }
}

const TeamInfoCard = ({
  control,
  tournamentFormat,
  serverErrors,
}: TeamInfoCardProps) => {
  const isTeam = tournamentFormat === 'TEAM'

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
          {isTeam
            ? fr.pages.admin.registration.labels.teamInfoTitle
            : fr.pages.admin.registration.labels.playerInfoTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isTeam && (
          <FormField
            control={control}
            name="teamName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {fr.pages.admin.registration.labels.teamName}
                </FormLabel>
                <FormControl>
                  <div className="relative group">
                    <Trophy className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-blue-400" />
                    <Input
                      placeholder={fr.pages.admin.registration.placeholders.teamName}
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
                {fr.pages.admin.registration.labels.contactEmail}
              </FormLabel>
              <FormControl>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-blue-400" />
                  <Input
                    type="email"
                    placeholder={fr.pages.admin.registration.placeholders.email}
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
  )
}

interface PlayersListProps {
  control: Control<FormValues>
  playerFields: { id: string }[]
  append: UseFormReturn<FormValues>['setValue'] // simplified, actually append is complex type
  // Use generic Function type or specific UseFieldArrayReturn['append']
  // But strict typing suggests defining properly:
  // biome-ignore lint/suspicious/noExplicitAny: complex RHF type
  remove: (index: number) => void
  tournament: TournamentWithFields
}

// We need to match RHF types
type AppendType = (
  value: FormValues['players'][number] | FormValues['players'][number][],
  options?: { shouldFocus?: boolean },
) => void

const PlayersList = ({
  control,
  playerFields,
  append,
  remove,
  tournament,
}: {
  control: Control<FormValues>
  playerFields: { id: string }[]
  append: AppendType
  remove: (index: number) => void
  tournament: TournamentWithFields
}) => {
  const isTeam = tournament.format === 'TEAM'

  const handleAddPlayer = () => {
    append({
      nickname: '',
      isCaptain: false,
      data: tournament.fields.reduce(
        (acc: Record<string, string>, field: TournamentField) => ({
          ...acc,
          [field.id]: '',
        }),
        {},
      ),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Gamepad2 className="size-5 text-purple-400" />
          {isTeam
            ? fr.pages.admin.registration.labels.playersSection
            : fr.pages.admin.registration.labels.playerDetails}
        </h3>
        {isTeam && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddPlayer}
            className="border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600"
          >
            <Plus className="mr-2 h-4 w-4" /> {fr.pages.admin.registration.labels.addPlayer}
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
  )
}

interface PlayerCardProps {
  index: number
  control: Control<FormValues>
  onRemove: () => void
  tournamentFields: TournamentField[]
  isTeam: boolean
}

const PlayerCard = ({
  index,
  control,
  onRemove,
  tournamentFields,
  isTeam,
}: PlayerCardProps) => {
  return (
    <Card className="border-white/10 bg-zinc-900/30 backdrop-blur-sm overflow-hidden group hover:border-white/20 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between py-4 bg-white/5">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-zinc-200">
          <div className="flex size-6 items-center justify-center rounded bg-zinc-800 text-xs font-bold text-zinc-400">
            {index + 1}
          </div>
          {fr.pages.admin.registration.labels.player} {index + 1}
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
      <CardContent className="flex flex-col gap-4">
        <FormField
          control={control}
          name={`players.${index}.nickname`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-zinc-500">
                {fr.pages.admin.registration.labels.nickname}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={fr.pages.admin.registration.placeholders.nickname}
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
                  {customField.required && (
                    <span className="text-red-500">*</span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value as string | number}
                    type={customField.type === "NUMBER" ? "number" : "text"}
                    className="border-white/10 bg-zinc-950/30 text-white placeholder:text-zinc-700 focus:border-blue-500/50 focus:bg-zinc-950/50"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </CardContent>
    </Card>
  )
}
