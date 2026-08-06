"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ExportActionsProps = {
  caption: string;
  fileName: string;
  headerRow: string[];
  rows: string[][];
  className?: string;
  compact?: boolean;
};

function normalizeFileName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export function ExportActions({
  caption,
  fileName,
  headerRow,
  rows,
  className,
  compact = false,
}: ExportActionsProps) {
  const normalizedFileName = normalizeFileName(fileName);

  function exportRowsToCsv() {
    const csv = [
      headerRow.join(","),
      ...rows.map((row) =>
        row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${normalizedFileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function exportRowsToExcel() {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...rows]);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, caption);
    XLSX.writeFile(workbook, `${normalizedFileName}.xlsx`);
  }

  async function exportRowsToPdf() {
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF({
      orientation: headerRow.length > 5 ? "landscape" : "portrait",
      unit: "pt",
      format: "a4",
    });

    doc.setFontSize(14);
    doc.text(caption, 40, 40);
    autoTable(doc, {
      head: [headerRow],
      body: rows,
      startY: 56,
      styles: {
        fontSize: 9,
        cellPadding: 8,
        textColor: [51, 65, 85],
      },
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [100, 116, 139],
        lineColor: [226, 232, 240],
        lineWidth: 1,
      },
      bodyStyles: {
        lineColor: [226, 232, 240],
        lineWidth: 1,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 40, right: 40 },
    });
    doc.save(`${normalizedFileName}.pdf`);
  }

  return (
    <div className={className ? className : "flex items-center"}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-xl border-slate-200"
          >
            <Download className="h-4 w-4" />
            {compact ? null : <span>Export</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Export table</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={exportRowsToCsv}>
            <Download className="h-4 w-4" />
            CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              void exportRowsToExcel();
            }}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              void exportRowsToPdf();
            }}
          >
            <FileText className="h-4 w-4" />
            PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
