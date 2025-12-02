/**
 * File: components/admin/csv-export-button.tsx
 * Description: Client component for exporting registration data to CSV.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface CsvExportButtonProps {
  data: any[];
  fields: any[];
}

export function CsvExportButton({ data, fields }: CsvExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    // Flatten data
    const flattenedData = data.flatMap((reg) => {
      return reg.players.map((player: any) => {
        const row: any = {
          RegistrationID: reg.id,
          TeamName: reg.teamName || "",
          ContactEmail: reg.contactEmail,
          Status: reg.status,
          RegistrationDate: new Date(reg.createdAt).toISOString(),
          PlayerNickname: player.nickname,
          IsCaptain: player.isCaptain ? "Yes" : "No",
        };

        // Add dynamic fields
        fields.forEach((field) => {
          const playerData = player.data.find((d: any) => d.tournamentFieldId === field.id);
          row[field.label] = playerData ? playerData.value : "";
        });

        return row;
      });
    });

    // Convert to CSV
    const headers = Object.keys(flattenedData[0]);
    const csvContent = [
      headers.join(","),
      ...flattenedData.map((row) =>
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
    link.setAttribute("download", "registrations.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );
}
