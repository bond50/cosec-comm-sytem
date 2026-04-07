"use client";

import * as React from "react";
import {
  type ColumnFiltersState,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  FileSpreadsheet,
  Filter,
  FileText,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  caption: string;
  searchPlaceholder: string;
  searchableColumns: string[];
  emptyMessage: string;
  initialPageSize?: number;
  toolbarLabel?: string;
  toolbarFilters?: Array<{
    id: string;
    label: string;
    options: Array<{ label: string; value: string }>;
  }>;
};

function getValueAtPath(source: unknown, path: string): string {
  if (!source || typeof source !== "object") return "";

  const value = path
    .split(".")
    .reduce<unknown>(
      (current, segment) =>
        current && typeof current === "object"
          ? (current as Record<string, unknown>)[segment]
          : undefined,
      source,
    );

  if (value === null || value === undefined) return "";
  return String(value);
}

export function DataTable<TData>({
  columns,
  data,
  caption,
  searchPlaceholder,
  searchableColumns,
  emptyMessage,
  initialPageSize = 10,
  toolbarLabel = "Directory",
  toolbarFilters = [],
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    globalFilterFn: (row, _columnId, filterValue) => {
      const normalizedFilter = String(filterValue).trim().toLowerCase();

      if (!normalizedFilter) return true;

      return searchableColumns.some((path) =>
        getValueAtPath(row.original, path)
          .toLowerCase()
          .includes(normalizedFilter),
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const totalRows = table.getFilteredRowModel().rows.length;
  const pageRows = table.getRowModel().rows.length;
  const activeColumnFilterCount = columnFilters.filter(
    (filter) => filter.value !== undefined && filter.value !== "",
  ).length;
  const from =
    totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const to =
    totalRows === 0 ? 0 : Math.min(from + Math.max(pageRows - 1, 0), totalRows);
  const hasActiveFilters = Boolean(globalFilter) || activeColumnFilterCount > 0;

  const exportColumns = table
    .getAllLeafColumns()
    .filter((column) => column.id !== "actions");
  const exportHeaderRow = exportColumns.map((column) => {
    const header = column.columnDef.header;
    return typeof header === "string" ? header : column.id;
  });
  const exportRows = table.getSortedRowModel().rows.map((row) =>
    exportColumns.map((column) => {
      const rawValue = row.getValue(column.id);
      return rawValue === null || rawValue === undefined
        ? ""
        : String(rawValue);
    }),
  );

  function exportRowsToCsv() {
    const csv = [
      exportHeaderRow.join(","),
      ...exportRows.map((row) =>
        row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${toolbarLabel.toLowerCase().replace(/\s+/g, "-")}-export.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function exportRowsToExcel() {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.aoa_to_sheet([exportHeaderRow, ...exportRows]);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, toolbarLabel);
    XLSX.writeFile(
      workbook,
      `${toolbarLabel.toLowerCase().replace(/\s+/g, "-")}-export.xlsx`,
    );
  }

  async function exportRowsToPdf() {
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF({
      orientation: exportHeaderRow.length > 5 ? "landscape" : "portrait",
      unit: "pt",
      format: "a4",
    });

    doc.setFontSize(14);
    doc.text(caption, 40, 40);
    autoTable(doc, {
      head: [exportHeaderRow],
      body: exportRows,
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
    doc.save(`${toolbarLabel.toLowerCase().replace(/\s+/g, "-")}-export.pdf`);
  }

  function clearAllFilters() {
    setGlobalFilter("");
    setColumnFilters([]);
    table.resetColumnFilters();
    table.setPageIndex(0);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500"
              >
                {toolbarLabel}
              </Badge>
              <Badge
                variant="outline"
                className="rounded-full border-slate-200 bg-white px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500"
              >
                {totalRows} records
              </Badge>
              {hasActiveFilters ? (
                <Badge className="rounded-full bg-[#eef2ff] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#465fff]">
                  {activeColumnFilterCount + (globalFilter ? 1 : 0)} filter
                  {activeColumnFilterCount + (globalFilter ? 1 : 0) === 1
                    ? ""
                    : "s"}{" "}
                  active
                </Badge>
              ) : null}
            </div>
            <h3 className="text-lg font-semibold text-slate-950">{caption}</h3>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {toolbarFilters.map((filter) => (
                <Select
                  key={filter.id}
                  value={String(
                    table.getColumn(filter.id)?.getFilterValue() ?? "all",
                  )}
                  onValueChange={(value) => {
                    table
                      .getColumn(filter.id)
                      ?.setFilterValue(value === "all" ? undefined : value);
                    table.setPageIndex(0);
                  }}
                >
                  <SelectTrigger className="h-10 min-w-[150px] rounded-xl border-slate-200 bg-white text-slate-700 shadow-none">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-slate-400" />
                      <SelectValue placeholder={filter.label} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {filter.label}</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  <Filter className="h-4 w-4 text-slate-400" />
                  Clear filters
                </button>
              ) : (
                <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">
                  <Filter className="h-4 w-4 text-slate-400" />
                  Filters
                </div>
              )}
              <button
                type="button"
                onClick={exportRowsToCsv}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <Download className="h-4 w-4 text-slate-400" />
                CSV
              </button>
              <button
                type="button"
                onClick={exportRowsToExcel}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                Excel
              </button>
              <button
                type="button"
                onClick={exportRowsToPdf}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                PDF
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <span>Show</span>
                <Select
                  value={String(pagination.pageSize)}
                  onValueChange={(value) => table.setPageSize(Number(value))}
                >
                  <SelectTrigger className="h-10 min-w-[84px] rounded-xl border-slate-200 bg-white text-slate-700 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 30, 50].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>entries</span>
              </div>

              <label className="relative block w-full sm:w-[260px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={globalFilter}
                  onChange={(event) => {
                    setGlobalFilter(event.target.value);
                    table.setPageIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="pl-11"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-slate-50/90">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-200">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortState = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-slate-500"
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-2 text-left transition hover:text-slate-950"
                        >
                          <span>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </span>
                          {sortState === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5 text-slate-400" />
                          ) : sortState === "desc" ? (
                            <ArrowDown className="h-3.5 w-3.5 text-slate-400" />
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />
                          )}
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-200 transition odd:bg-white even:bg-slate-50/40 hover:bg-slate-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn("px-6 py-4 align-middle text-slate-600")}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-sm text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Showing {from} to {to} of {totalRows} entries
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-xl"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount() || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-xl"
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
