"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { CalendarDays, Eye, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MeetingRegistryItem } from "@/features/meetings/queries/meetings";

function formatMeetingDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getMeetingStatusLabel(status: string) {
  switch (status) {
    case "ACTION_POINTS_ISSUED":
      return "Action points issued";
    case "CLOSED":
      return "Closed";
    default:
      return status.replaceAll("_", " ");
  }
}

export function MeetingsDirectoryTable({
  meetings,
  toolbarPrimaryAction,
}: {
  meetings: MeetingRegistryItem[];
  toolbarPrimaryAction?: React.ReactNode;
}) {
  const columns: ColumnDef<MeetingRegistryItem>[] = [
    {
      id: "title",
      accessorKey: "title",
      header: "Meeting",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6f1f8] text-[#1868a6]">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <Link
              href={`/dashboard/meetings/${row.original.id}`}
              className="font-medium text-slate-900 transition hover:text-[#1868a6]"
            >
              {row.original.title}
            </Link>
          </div>
        </div>
      ),
    },
    {
      id: "startsAt",
      accessorKey: "startsAt",
      header: "Schedule",
      cell: ({ row }) => (
        <div className="space-y-1 text-sm text-slate-600">
          <div>{formatMeetingDate(row.original.startsAt)}</div>
          <div className="text-xs text-slate-500">
            {row.original.endsAt
              ? `Ends ${formatMeetingDate(row.original.endsAt)}`
              : "No end time recorded"}
          </div>
        </div>
      ),
    },
    {
      id: "venue",
      accessorKey: "venue",
      header: "Venue",
      cell: ({ row }) => row.original.venue || "Not set",
    },
    {
      id: "correspondence",
      accessorFn: (row) =>
        row.correspondence
          ? `${row.correspondence.referenceNumber} ${row.correspondence.subject}`
          : "Not linked",
      header: "Correspondence",
      cell: ({ row }) =>
        row.original.correspondence ? (
          <Link
            href={`/dashboard/correspondences/${row.original.correspondence.id}`}
            className="font-medium text-[#1868a6] hover:no-underline"
          >
            {row.original.correspondence.referenceNumber}
          </Link>
        ) : (
          "Not linked"
        ),
    },
    {
      id: "organizer",
      accessorFn: (row) => row.organizer || "Not assigned",
      header: "Organizer",
      cell: ({ row }) => row.original.organizer || "Not assigned",
    },
    {
      id: "chairperson",
      accessorFn: (row) => row.chairperson || "Not assigned",
      header: "Chairperson",
      cell: ({ row }) => row.original.chairperson || "Not assigned",
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className="rounded-full bg-[#e6f1f8] text-[#1868a6]">
          {getMeetingStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      id: "actionPointCount",
      accessorFn: (row) => row._count.actionPoints,
      header: "Action points",
      cell: ({ row }) => row.original._count.actionPoints,
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Link
            href={`/dashboard/meetings/${row.original.id}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            aria-label={`Open ${row.original.title}`}
            title="Open meeting"
          >
            <Eye className="h-4 w-4 text-slate-400" />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 rounded-xl p-0"
                aria-label={`More actions for ${row.original.title}`}
              >
                <MoreHorizontal className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/meetings/${row.original.id}`}>
                  <Eye className="h-4 w-4" />
                  Open meeting
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const statusOptions = Array.from(
    new Set(meetings.map((meeting) => meeting.status)),
  ).map((status) => ({
    label: getMeetingStatusLabel(status),
    value: status,
  }));

  return (
    <DataTable
      columns={columns}
      data={meetings}
      caption="Meetings"
      searchPlaceholder="Search meetings"
      searchableColumns={[
        "title",
        "description",
        "venue",
        "correspondence",
        "organizer",
        "chairperson",
      ]}
      emptyMessage="No meetings have been created yet."
      toolbarLabel="Meetings"
      toolbarPrimaryAction={toolbarPrimaryAction}
      toolbarFilters={[
        {
          id: "status",
          label: "statuses",
          options: statusOptions,
        },
      ]}
    />
  );
}
