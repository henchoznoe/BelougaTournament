/**
 * File: components/features/tournament/form/tournament-form.tsx
 * Description: Reusable form component for creating and editing tournaments.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

"use client"

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { fr } from "@/lib/i18n/dictionaries/fr"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"

import { ActionState } from "@/lib/types/actions"
import { tournamentSchema } from "@/lib/validations/tournament"
import { TournamentFormat } from "@/prisma/generated/prisma/enums"
import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CustomFieldsManager } from "./tournament-form/custom-fields-manager"
import { DatesSection } from "./tournament-form/dates-section"
import { GeneralInfoSection } from "./tournament-form/general-info-section"
import { SettingsSection } from "./tournament-form/settings-section"

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------



const formSchema = tournamentSchema

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

type TournamentFormProps = {
  initialData?: z.infer<typeof formSchema>
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<ActionState>
  submitLabel?: string
}

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

export const TournamentForm = ({
  initialData,
  onSubmit,
  submitLabel,
}: TournamentFormProps) => {
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: "",
      slug: "",
      description: "",
      format: TournamentFormat.SOLO,
      teamSize: 1,
      fields: [],
    },
  })

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setServerError(null)

    const result = await onSubmit(values)

    if (!result.success) {
      setServerError(
        result.message || fr.common.errors.generic,
      )
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {serverError && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500">
            {serverError}
          </div>
        )}
        <div className="grid gap-6">
          <GeneralInfoSection />
          <DatesSection />
          <SettingsSection />
          <CustomFieldsManager />

          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
            >
              <Save className="mr-2 h-5 w-5" />
              {submitLabel || fr.pages.admin.tournaments.form.createSubmit}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
