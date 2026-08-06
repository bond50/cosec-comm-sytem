"use client";
"use no memo";
/* eslint-disable react-hooks/incompatible-library */

import * as React from "react";
import {
  type ColumnFiltersState,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type VisibilityState,
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
  Filter,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportActions } from "@/components/ui/export-actions";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const EMPTY_COLUMN_FILTERS: ColumnFiltersState = [];

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  caption?: string;
  description?: string;
  searchPlaceholder: string;
  searchableColumns: string[];
  emptyMessage: string;
  initialPageSize?: number;
  toolbarLabel?: string;
  showToolbarMeta?: boolean;
  toolbarFilters?: Array<{
    id: string;
    label: string;
    options: Array<{ label: string; value: string }>;
  }>;
  toolbarPrimaryAction?: React.ReactNode;
  initialColumnFilters?: ColumnFiltersState;
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
  description,
  searchPlaceholder,
  searchableColumns,
  emptyMessage,
  initialPageSize = 10,
  toolbarLabel = "Directory",
  showToolbarMeta = true,
  toolbarFilters = [],
  toolbarPrimaryAction,
  initialColumnFilters = EMPTY_COLUMN_FILTERS,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(initialColumnFilters);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  React.useEffect(() => {
    setColumnFilters(initialColumnFilters);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [initialColumnFilters]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
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
  const exportCaption = caption ?? toolbarLabel;
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

  function clearAllFilters() {
    setGlobalFilter("");
    setColumnFilters([]);
    table.resetColumnFilters();
    table.setPageIndex(0);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3">
          {showToolbarMeta ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                {caption ? (
                  <h3 className="text-lg font-semibold text-slate-950">
                    {caption}
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      {totalRows} {totalRows === 1 ? "record" : "records"}
                    </span>
                  </h3>
                ) : null}
                {description ? (
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                    {description}
                  </p>
                ) : null}
              </div>

              {toolbarPrimaryAction ? <div>{toolbarPrimaryAction}</div> : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {!showToolbarMeta && toolbarPrimaryAction ? (
              <div className="w-full sm:mr-1 sm:w-auto">
                {toolbarPrimaryAction}
              </div>
            ) : null}
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
                <SelectTrigger className="h-10 min-w-[132px] rounded-xl border-slate-200 bg-white text-slate-700 shadow-none sm:min-w-[144px]">
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
            {toolbarFilters.length > 0 && hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                <Filter className="h-4 w-4 text-slate-400" />
                Clear filters
              </button>
            ) : null}

            <label className="relative ml-auto w-full sm:w-[240px]">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl border-slate-200"
                >
                  <Columns3 className="h-4 w-4" />
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      column.getCanHide() &&
                      typeof column.accessorFn !== "undefined",
                  )
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(Boolean(value))
                      }
                      className="capitalize"
                    >
                      {String(column.columnDef.header ?? column.id)}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <ExportActions
              caption={exportCaption}
              fileName={`${toolbarLabel} export`}
              headerRow={exportHeaderRow}
              rows={exportRows}
              compact
            />

            <div className="flex items-center gap-2 text-sm text-slate-600">
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
            </div>
          </div>
        </div>
      </div>

      <Table className="min-w-[860px] text-sm">
        <TableHeader className="bg-slate-50/90">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-slate-200 hover:bg-transparent"
            >
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortState = header.column.getIsSorted();

                return (
                  <TableHead
                    key={header.id}
                    className="px-4 py-4 text-left text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:px-6 sm:text-[0.78rem]"
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
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-b border-slate-200 transition odd:bg-white even:bg-slate-50/40 hover:bg-slate-50"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "px-4 py-4 align-middle text-slate-600 sm:px-6",
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getVisibleLeafColumns().length}
                className="px-4 py-10 text-center text-sm text-slate-500 sm:px-6"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
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
