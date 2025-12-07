/**
 * File: components/admin/csv-export-button.tsx
 * Description: Client component for exporting registration data to CSV.
 * Author: Noé Henchoz
 * Date: 2025-12-04
 * License: MIT
 */

"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { exportTournamentData } from "@/lib/actions/tournaments";
import { toast } from "sonner";

interface CsvExportButtonProps {
  tournamentId: string;
}

export function CsvExportButton({ tournamentId }: CsvExportButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      try {
        const result = await exportTournamentData(tournamentId);

        if (!result.success || !result.inputs) {
          toast.error(result.message || "Failed to export data.");
          return;
        }

        const data = JSON.parse(result.inputs as string);

        if (!data || data.length === 0) {
            toast.error("No data to export.");
            return;
        }

        // Convert to CSV
        // biome-ignore lint/suspicious/noExplicitAny: Data is dynamic JSON
        const headers = Object.keys(data[0]);
        const csvContent = [
          headers.join(","),
          // biome-ignore lint/suspicious/noExplicitAny: Data is dynamic JSON
          ...data.map((row: any) =>
            headers
              .map((header) => {
                const value = row[header] ? row[header].toString().replace(/"/g, '""') : "";
                return `"${value}"`;
              })
              .join(",")
          ),
        ].join("\n");

        // Download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `tournament-${tournamentId}-registrations.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Export successful!");
      } catch (error) {
        console.error("Export failed:", error);
        toast.error("Failed to export data.");
      }
    });
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={isPending}>
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Export CSV
    </Button>
  );
}
