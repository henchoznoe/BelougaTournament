"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatDateTime } from "@/lib/utils";
import { CalendarIcon, Clock } from "lucide-react";
import { useFormContext } from "react-hook-form";

export function DatesSection() {
  const { control } = useFormContext();

  // Helper to update specific time parts of a date
  const updateTime = (date: Date | undefined, type: "hour" | "minute", value: string) => {
    if (!date) return new Date();
    const newDate = new Date(date);
    if (type === "hour") newDate.setHours(parseInt(value));
    if (type === "minute") newDate.setMinutes(parseInt(value));
    return newDate;
  };

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
                            formatDateTime(field.value)
                          ) : (
                            <span>Choisir une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-zinc-950 border-white/10" align="start">
                      <div className="p-3 border-b border-white/10">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(newDate) => {
                             if (newDate) {
                               // Preserve time if updating date
                               const current = field.value ? new Date(field.value) : new Date();
                               newDate.setHours(current.getHours());
                               newDate.setMinutes(current.getMinutes());
                               field.onChange(newDate);
                             }
                          }}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                          className="bg-zinc-950 text-white p-0"
                        />
                      </div>
                      <div className="p-3 flex items-center gap-2 bg-zinc-900/50">
                        <Clock className="h-4 w-4 text-zinc-400" />
                        <Select
                          value={field.value ? new Date(field.value).getHours().toString() : "0"}
                          onValueChange={(val) => field.onChange(updateTime(field.value, "hour", val))}
                        >
                          <SelectTrigger className="h-8 w-[70px] bg-zinc-950 border-white/10 text-white">
                            <SelectValue placeholder="HH" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-950 border-white/10 text-white max-h-[200px]">
                            {Array.from({ length: 24 }).map((_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-zinc-400">:</span>
                        <Select
                          value={field.value ? new Date(field.value).getMinutes().toString() : "0"}
                          onValueChange={(val) => field.onChange(updateTime(field.value, "minute", val))}
                        >
                          <SelectTrigger className="h-8 w-[70px] bg-zinc-950 border-white/10 text-white">
                            <SelectValue placeholder="MM" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-950 border-white/10 text-white max-h-[200px]">
                            {Array.from({ length: 60 }).map((_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i.toString().padStart(2, '0')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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
