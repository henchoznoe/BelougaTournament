/**
 * File: components/features/tournament/form/tournament-form/custom-fields-manager.tsx
 * Description: Form section for managing dynamic tournament registration fields.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

"use client"

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { useFieldArray, useFormContext } from "react-hook-form"

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

export const CustomFieldsManager = () => {
  const { control } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "fields",
  })

  return (
    <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white">Champs d'Inscription</CardTitle>
          <CardDescription className="text-zinc-400">
            Définissez des champs dynamiques pour l'inscription des joueurs.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ label: "", type: "TEXT", required: true })}
          className="border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un champ
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid gap-4 p-4 rounded-lg border border-white/10 bg-black/20 md:grid-cols-[1fr,150px,auto,auto] items-end"
          >
            <FormField
              control={control}
              name={`fields.${index}.label`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Label</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ex: Rang, Pseudo Discord..."
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
              name={`fields.${index}.type`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-400">Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
              control={control}
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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              className="text-red-500 hover:text-red-400 hover:bg-red-500/10 mb-0.5"
            >
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
  )
}
