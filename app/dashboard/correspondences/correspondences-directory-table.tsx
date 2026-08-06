"use client";

import Link from "next/link";
import type { ColumnDef, ColumnFiltersState } from "@tanstack/react-table";
import {
  Eye,
  FileText,
  MoreHorizontal,
  PlusSquare,
  TriangleAlert,
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
import type { CorrespondenceListItemWithSla } from "@/features/correspondence/queries/correspondence-list";

type CorrespondencesDirectoryTableProps = {
  correspondences: CorrespondenceListItemWithSla[];
  canRegister: boolean;
  toolbarPrimaryAction?: React.ReactNode;
  initialColumnFilters?: ColumnFiltersState;
};

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

function getPriorityBadgeClass(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "VERY_URGENT":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "URGENT":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "NEW":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "UNDER_REVIEW":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "DISPATCHED":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "IN_PROGRESS":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "AWAITING_FEEDBACK":
      return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CANCELLED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "CLOSED":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

export function CorrespondencesDirectoryTable({
  correspondences,
  canRegister,
  toolbarPrimaryAction,
  initialColumnFilters,
}: CorrespondencesDirectoryTableProps) {
  const typeOptions = Array.from(
    new Set(correspondences.map((correspondence) => correspondence.type)),
  ).map((type) => ({
    label: type,
    value: type,
  }));

  const statusOptions = Array.from(
    new Set(correspondences.map((correspondence) => correspondence.status)),
  ).map((status) => ({
    label: status.replaceAll("_", " "),
    value: status,
  }));

  const priorityOptions = Array.from(
    new Set(correspondences.map((correspondence) => correspondence.priority)),
  ).map((priority) => ({
    label: priority.replaceAll("_", " "),
    value: priority,
  }));

  const confidentialityOptions = Array.from(
    new Set(
      correspondences.map((correspondence) => correspondence.confidentiality),
    ),
  ).map((confidentiality) => ({
    label: confidentiality.replaceAll("_", " "),
    value: confidentiality,
  }));

  const departmentOptions = Array.from(
    new Set(
      correspondences
        .map((correspondence) => correspondence.assignedToDepartment?.name)
        .filter((department): department is string => Boolean(department)),
    ),
  ).map((department) => ({
    label: department,
    value: department,
  }));

  const columns: ColumnDef<CorrespondenceListItemWithSla>[] = [
    {
      accessorKey: "referenceNumber",
      header: "Reference",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6f1f8] text-[#1868a6]">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-950">
              {row.original.referenceNumber}
            </div>
            <div className="text-[0.7rem] font-medium uppercase tracking-[0.08em] text-slate-400">
              {row.original.type}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className="px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] border-slate-200 bg-slate-50 text-slate-700"
        >
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => (
        <div className="min-w-0 font-medium text-slate-950">
          {row.original.subject}
        </div>
      ),
    },
    {
      accessorKey: "senderOffice",
      header: "Source office",
      cell: ({ row }) => (
        <div className="max-w-[220px] leading-6 text-slate-600">
          {row.original.senderOffice}
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${getPriorityBadgeClass(row.original.priority)}`}
        >
          {row.original.priority.replaceAll("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "confidentiality",
      header: "Confidentiality",
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">
          {row.original.confidentiality.replaceAll("_", " ")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Workflow stage",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${getStatusBadgeClass(row.original.status)}`}
        >
          {row.original.status.replaceAll("_", " ")}
        </Badge>
      ),
    },
    {
      id: "assigned",
      accessorFn: (row) =>
        row.assignedToDepartment?.name ||
        row.assignedToUser?.name ||
        row.assignedToUser?.email ||
        "",
      header: "Routed to",
      cell: ({ row }) => {
        const department = row.original.assignedToDepartment?.name;
        const user =
          row.original.assignedToUser?.name ||
          row.original.assignedToUser?.email;

        return (
          <div className="min-w-0">
            <div className="font-medium text-slate-950">
              {department || "No receiving department"}
            </div>
            <div className="text-xs text-slate-500">
              {user || "No named receiving officer"}
            </div>
          </div>
        );
      },
    },
    {
      id: "assignedDepartmentName",
      accessorFn: (row) => row.assignedToDepartment?.name || "",
      header: "Receiving department",
      cell: ({ row }) => (
        <span className="text-sm text-slate-600">
          {row.original.assignedToDepartment?.name || "Not routed"}
        </span>
      ),
    },
    {
      accessorKey: "receivedAt",
      header: "Received",
      cell: ({ row }) => formatDateTime(row.original.receivedAt),
      sortingFn: "datetime",
    },
    {
      accessorKey: "dueDate",
      header: "Due date",
      cell: ({ row }) => formatDateTime(row.original.dueDate),
      sortingFn: "datetime",
    },
    {
      id: "overdue",
      accessorFn: (row) =>
        row.isOverdue
          ? "OVERDUE"
          : row.daysRemaining === null
            ? "NO_DUE_DATE"
            : row.daysRemaining === 0
              ? "DUE_TODAY"
              : "ON_TRACK",
      header: "Deadline state",
      cell: ({ row }) => {
        if (row.original.isOverdue) {
          return (
            <Badge className="rounded-full bg-rose-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-rose-700">
              <TriangleAlert className="mr-1.5 h-3.5 w-3.5" />
              Overdue
            </Badge>
          );
        }

        if (row.original.daysRemaining === null) {
          return <span className="text-sm text-slate-500">No due date</span>;
        }

        if (row.original.daysRemaining === 0) {
          return (
            <Badge className="rounded-full bg-amber-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-amber-700">
              Due today
            </Badge>
          );
        }

        return (
          <span className="text-sm text-slate-600">
            {row.original.daysRemaining} day
            {row.original.daysRemaining === 1 ? "" : "s"} remaining
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Link
            href={`/dashboard/correspondences/${row.original.id}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            aria-label={`Open ${row.original.referenceNumber}`}
            title="Open file"
          >
            <Eye className="h-4 w-4 text-slate-400" />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 rounded-xl p-0"
                aria-label={`More actions for ${row.original.referenceNumber}`}
              >
                <MoreHorizontal className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/correspondences/${row.original.id}`}>
                  <Eye className="h-4 w-4" />
                  Open file
                </Link>
              </DropdownMenuItem>
              {canRegister && row.original.status === "NEW" ? (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/correspondences/register">
                    <PlusSquare className="h-4 w-4" />
                    Register next
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
      data={correspondences}
      caption="Correspondence register"
      searchPlaceholder="Search correspondence..."
      searchableColumns={[
        "referenceNumber",
        "type",
        "subject",
        "senderName",
        "senderOffice",
        "priority",
        "status",
        "assignedToDepartment.name",
        "assignedToUser.name",
        "assignedToUser.email",
      ]}
      emptyMessage="No correspondence has been registered for this office yet."
      toolbarLabel="Correspondence register"
      toolbarPrimaryAction={toolbarPrimaryAction}
      initialColumnFilters={initialColumnFilters}
      toolbarFilters={[
        { id: "type", label: "types", options: typeOptions },
        { id: "status", label: "statuses", options: statusOptions },
        { id: "priority", label: "priorities", options: priorityOptions },
        {
          id: "confidentiality",
          label: "confidentiality levels",
          options: confidentialityOptions,
        },
        {
          id: "assignedDepartmentName",
          label: "departments",
          options: departmentOptions,
        },
      ]}
    />
  );
}
