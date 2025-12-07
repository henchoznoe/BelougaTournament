/**
 * File: components/admin/tournament-form/dates-section.tsx
 * Description: Form section for tournament dates configuration.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";

export function DatesSection() {
  const { control } = useFormContext();

  return (
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
              control={control}
              name={dateField.name}
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
  );
}
