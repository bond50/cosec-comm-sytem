"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpRight,
  Building2,
  Eye,
  MoreHorizontal,
  PencilLine,
  Plus,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getDepartmentKindLabel } from "@/features/application/lib/department-model";
import type { DepartmentSummary } from "@/features/application/queries/departments";

type DepartmentsDirectoryTableProps = {
  departments: DepartmentSummary[];
  canManageDepartments: boolean;
  onCreate?: () => void;
};

export function DepartmentsDirectoryTable({
  departments,
  canManageDepartments,
  onCreate,
}: DepartmentsDirectoryTableProps) {
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
      header: "Entity / department",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f1f8] text-[#1868a6]">
            <Building2 className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 font-semibold text-slate-950">
            {row.original.name}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "kind",
      header: "Type",
      cell: ({ row }) => getDepartmentKindLabel(row.original.kind),
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => row.original.code || "No code",
    },
    {
      accessorKey: "headUser.name",
      header: "Lead",
      cell: ({ row }) => (
        <div className="min-w-[170px]">
          <div className="flex items-center gap-2 font-medium text-slate-800">
            <UserRound className="h-3.5 w-3.5 text-slate-400" />
            {row.original.headUser?.name || "Not assigned"}
          </div>
          <div className="text-xs text-slate-500">
            {row.original.headUser?.email || "No accountable lead set"}
          </div>
        </div>
      ),
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
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Link
            href={`/dashboard/departments/${row.original.id}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            aria-label={`Open ${row.original.name}`}
            title="Open"
          >
            <Eye className="h-4 w-4 text-slate-400" />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 rounded-xl p-0"
                aria-label={`More actions for ${row.original.name}`}
              >
                <MoreHorizontal className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/departments/${row.original.id}`}>
                  <Eye className="h-4 w-4" />
                  Open detail
                  <ArrowUpRight className="ml-auto h-4 w-4" />
                </Link>
              </DropdownMenuItem>
              {canManageDepartments ? (
                <DropdownMenuItem asChild>
                  <Link
                    href={`/dashboard/departments/${row.original.id}?mode=edit`}
                  >
                    <PencilLine className="h-4 w-4" />
                    Edit entity
                  </Link>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={departments}
      showToolbarMeta={false}
      searchPlaceholder="Search entities..."
      searchableColumns={[
        "name",
        "code",
        "kind",
        "status",
        "description",
        "headUser.name",
        "headUser.email",
      ]}
      emptyMessage="No entities have been added for this organization yet."
      toolbarLabel="Manage entities"
      toolbarPrimaryAction={
        canManageDepartments && onCreate ? (
          <Button
            onClick={onCreate}
            className="h-10 w-full rounded-xl bg-[#1868a6] px-4 text-sm font-semibold hover:bg-[#3648d8] sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add entity
          </Button>
        ) : null
      }
    />
  );
}
