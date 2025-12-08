/**
 * File: components/features/tournament/form/tournament-form/general-info-section.tsx
 * Description: Form section for general tournament information (Title, Slug, Description).
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

"use client"

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useFormContext } from "react-hook-form"
import { fr } from "@/lib/i18n/dictionaries/fr"

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

export const GeneralInfoSection = () => {
  const { control } = useFormContext()

  return (
    <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
      <CardHeader>
        <CardTitle className="text-white">{fr.pages.admin.tournaments.form.sections.general.title}</CardTitle>
        <CardDescription className="text-zinc-400">
          {fr.pages.admin.tournaments.form.sections.general.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-400">{fr.pages.admin.tournaments.form.sections.general.labels.title}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={fr.pages.admin.tournaments.form.sections.general.placeholders.title}
                    {...field}
                    className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-400">{fr.pages.admin.tournaments.form.sections.general.labels.slug}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={fr.pages.admin.tournaments.form.sections.general.placeholders.slug}
                    {...field}
                    className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-400">{fr.pages.admin.tournaments.form.sections.general.labels.description}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={fr.pages.admin.tournaments.form.sections.general.placeholders.description}
                  {...field}
                  className="bg-zinc-900/50 border-white/10 focus:border-blue-500 focus:ring-blue-500/20 text-white placeholder:text-zinc-600 min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  )
}
