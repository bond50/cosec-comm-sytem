"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import type { DepartmentSummary } from "@/features/application/queries/departments";

type DepartmentsDirectoryTableProps = {
  departments: DepartmentSummary[];
  canManageDepartments: boolean;
};

export function DepartmentsDirectoryTable({
  departments,
  canManageDepartments,
}: DepartmentsDirectoryTableProps) {
  const statusOptions = Array.from(
    new Set(departments.map((department) => department.status)),
  ).map((status) => ({
    label: status,
    value: status,
  }));

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "INACTIVE":
        return "border-slate-200 bg-slate-100 text-slate-600";
      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  };

  const columns: ColumnDef<DepartmentSummary>[] = [
    {
      accessorKey: "name",
      header: "Department",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef2ff] text-[#465fff]">
            <Building2 className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-950">
              {row.original.name}
            </div>
            <div className="text-xs text-slate-500">
              {row.original.description || "No description provided."}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => row.original.code || "No code",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${getStatusBadgeClass(row.original.status)}`}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="block max-w-[360px] leading-6 text-slate-600">
          {row.original.description || "No description provided."}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Action",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Link
            href={`/dashboard/departments/${row.original.id}`}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Open
          </Link>
          {canManageDepartments ? (
            <Link
              href={`/dashboard/departments/${row.original.id}?mode=edit`}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Edit
            </Link>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={departments}
      caption="Department directory"
      searchPlaceholder="Search departments..."
      searchableColumns={["name", "code", "status", "description"]}
      emptyMessage="No departments have been created for this organization yet."
      toolbarLabel="Departments"
      toolbarFilters={[
        { id: "status", label: "statuses", options: statusOptions },
      ]}
    />
  );
}
