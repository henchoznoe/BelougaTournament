/**
 * File: components/features/admin/actions/csv-export.tsx
 * Description: Client component for exporting registration data to CSV.
 * Author: Noé Henchoz
 * Date: 2025-12-07
 * License: MIT
 */

"use client"

// ----------------------------------------------------------------------
// IMPORTS
// ----------------------------------------------------------------------

import { Download, Loader2 } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { exportTournamentData } from "@/lib/actions/tournaments"

// ----------------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------------

const CONTENT = {
  EXPORT_BTN: "Export CSV",
  SUCCESS: "Export successful!",
  ERROR_GENERIC: "Failed to export data.",
  ERROR_NO_DATA: "No data to export.",
  FILENAME_PREFIX: "tournament-",
  FILENAME_SUFFIX: "-registrations.csv",
} as const

// ----------------------------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------------------------

interface CsvExportButtonProps {
  tournamentId: string
}

type ExportDataRow = Record<string, string | number | boolean | null>

// ----------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------

export const CsvExportButton = ({ tournamentId }: CsvExportButtonProps) => {
  const [isPending, startTransition] = useTransition()

  const handleExport = () => {
    startTransition(async () => {
      try {
        const result = await exportTournamentData(tournamentId)

        if (!result.success || !result.inputs) {
          toast.error(result.message || CONTENT.ERROR_GENERIC)
          return
        }

        const data = JSON.parse(result.inputs as string) as ExportDataRow[]

        if (!data || data.length === 0) {
          toast.error(CONTENT.ERROR_NO_DATA)
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
          `${CONTENT.FILENAME_PREFIX}${tournamentId}${CONTENT.FILENAME_SUFFIX}`,
        )
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.success(CONTENT.SUCCESS)
      } catch (_error) {
        toast.error(CONTENT.ERROR_GENERIC)
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
      {CONTENT.EXPORT_BTN}
    </Button>
  )
}
