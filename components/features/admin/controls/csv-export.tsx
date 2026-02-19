/**
 * File: components/features/admin/controls/csv-export.tsx
 * Description: Client component for exporting registration data to CSV.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

"use client"

import { Download, Loader2 } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { exportTournamentData } from "@/lib/actions/tournament"

const CONFIG = {
  FILENAME_PREFIX: "tournoi-",
  FILENAME_SUFFIX: "-inscriptions.csv",
} as const

interface CsvExportButtonProps {
  tournamentId: string
}

type ExportDataRow = Record<string, string | number | boolean | null>

export const CsvExportButton = ({ tournamentId }: CsvExportButtonProps) => {
  const [isPending, startTransition] = useTransition()

  const handleExport = () => {
    startTransition(async () => {
      try {
        const result = await exportTournamentData(tournamentId)

        if (!result.success || !result.inputs) {
          toast.error(result.message || "Erreur lors de l'exportation")
          return
        }

        const data = JSON.parse(result.inputs as string) as ExportDataRow[]

        if (!data || data.length === 0) {
          toast.error("Aucune donnée à exporter")
          return
        }

        const headers = Object.keys(data[0])
        const csvContent = [
          headers.join(","),
          ...data.map((row) =>
            headers
              .map((header) => {
                const value = row[header]
                  ? row[header]?.toString().replace(/"/g, '""')
                  : ""
                return `"${value}"`
              })
              .join(","),
          ),
        ].join("\n")

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute(
          "download",
          `${CONFIG.FILENAME_PREFIX}${tournamentId}${CONFIG.FILENAME_SUFFIX}`,
        )
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.success("Exportation réussie")
      } catch (_error) {
        toast.error("Erreur lors de l'exportation")
      }
    })
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={isPending}>
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Exporter les données
    </Button>
  )
}
