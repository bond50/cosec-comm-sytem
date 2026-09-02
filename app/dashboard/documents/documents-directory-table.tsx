"use client";

import Link from "next/link";
import { DocumentMedium } from "@prisma/client";
import { type ColumnDef } from "@tanstack/react-table";
import { Archive, Eye, FileStack } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ArchiveDocumentButton } from "@/app/dashboard/documents/archive-document-button";
import type { DocumentRegistryItem } from "@/features/documents/queries/documents";
import { formatUserLabel } from "@/features/application/lib/user-label";

function getDocumentMediumLabel(medium: DocumentMedium) {
  switch (medium) {
    case DocumentMedium.DIGITAL:
      return "Digital";
    case DocumentMedium.HYBRID:
      return "Physical + digital";
    default:
      return "Physical";
  }
}

export function DocumentsDirectoryTable({
  documents,
  canArchive,
  toolbarPrimaryAction,
}: {
  documents: DocumentRegistryItem[];
  canArchive: boolean;
  toolbarPrimaryAction?: React.ReactNode;
}) {
  const columns: ColumnDef<DocumentRegistryItem>[] = [
    {
      id: "title",
      accessorKey: "title",
      header: "Document",
      cell: ({ row }) => {
        const document = row.original;

        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6f1f8] text-[#1868a6]">
              <FileStack className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <Link
                href={`/dashboard/documents/${document.id}`}
                className="font-medium text-slate-900 transition hover:text-[#1868a6]"
              >
                {document.title}
              </Link>
              <div className="text-[0.7rem] text-slate-400">
                {document.referenceNumber || "No reference number"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "category.name",
      accessorFn: (row) => row.category?.name ?? "Uncategorized",
      header: "Category",
      cell: ({ row }) => row.original.category?.name ?? "Uncategorized",
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Document status",
      cell: ({ row }) => {
        const status = row.original.status;
        const isArchived = row.original.isArchived;

        return (
          <Badge
            className={
              isArchived
                ? "rounded-full bg-slate-100 text-slate-700"
                : "rounded-full bg-[#e6f1f8] text-[#1868a6]"
            }
          >
            {status.replaceAll("_", " ")}
          </Badge>
        );
      },
    },
    {
      id: "archiveState",
      accessorFn: (row) => (row.isArchived ? "ARCHIVED" : "ACTIVE"),
      header: "Archive state",
      cell: ({ row }) =>
        row.original.isArchived ? (
          <Badge className="rounded-full bg-slate-100 text-slate-700">
            Archived
          </Badge>
        ) : (
          <Badge className="rounded-full bg-emerald-50 text-emerald-700">
            Active
          </Badge>
        ),
    },
    {
      id: "medium",
      accessorKey: "medium",
      header: "Medium",
      cell: ({ row }) => getDocumentMediumLabel(row.original.medium),
    },
    {
      id: "correspondence.referenceNumber",
      accessorFn: (row) => row.correspondence?.referenceNumber ?? "",
      header: "Linked correspondence",
      cell: ({ row }) =>
        row.original.correspondence ? (
          <Link
            href={`/dashboard/correspondences/${row.original.correspondence.id}`}
            className="text-sm font-medium text-[#1868a6] transition hover:text-[#3447d4]"
          >
            {row.original.correspondence.referenceNumber}
          </Link>
        ) : (
          "Not linked"
        ),
    },
    {
      id: "currentHolderUser.name",
      accessorFn: (row) => formatUserLabel(row.currentHolderUser, "Unassigned"),
      header: "Current holder",
      cell: ({ row }) =>
        formatUserLabel(row.original.currentHolderUser, "Unassigned"),
    },
    {
      id: "currentLocation",
      accessorKey: "currentLocation",
      header: "Location",
      cell: ({ row }) => row.original.currentLocation || "Not recorded",
    },
    {
      id: "attachmentCount",
      accessorFn: (row) => row._count.attachments,
      header: "Files",
      cell: ({ row }) => row.original._count.attachments,
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/dashboard/documents/${row.original.id}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            aria-label={`Open ${row.original.title}`}
            title="Open"
          >
            <Eye className="h-4 w-4 text-slate-400" />
          </Link>
          {canArchive ? (
            <ArchiveDocumentButton
              documentId={row.original.id}
              isArchived={row.original.isArchived}
              compact
            />
          ) : row.original.isArchived ? (
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400"
              title="Archived"
            >
              <Archive className="h-4 w-4" />
            </span>
          ) : null}
        </div>
      ),
    },
  ];

  const categoryOptions = Array.from(
    new Set(
      documents
        .map((document) => document.category?.name)
        .filter((value): value is string => Boolean(value)),
    ),
  ).map((name) => ({
    label: name,
    value: name,
  }));

  const statusOptions = Array.from(
    new Set(documents.map((document) => document.status)),
  ).map((status) => ({
    label: status.replaceAll("_", " "),
    value: status,
  }));

  const mediumOptions = Array.from(
    new Set(documents.map((document) => document.medium)),
  ).map((medium) => ({
    label: getDocumentMediumLabel(medium),
    value: medium,
  }));

  const archiveOptions = [
    { label: "Active records", value: "ACTIVE" },
    { label: "Archived records", value: "ARCHIVED" },
  ];

  return (
    <DataTable
      columns={columns}
      data={documents}
      caption="Document registry"
      searchPlaceholder="Search active and archived documents"
      searchableColumns={[
        "title",
        "referenceNumber",
        "category.name",
        "medium",
        "status",
        "correspondence.referenceNumber",
        "currentHolderUser.name",
        "currentHolderUser.email",
        "currentLocation",
      ]}
      emptyMessage="No physical or digital document records have been created yet."
      toolbarLabel="Document registry"
      toolbarPrimaryAction={toolbarPrimaryAction}
      toolbarFilters={[
        {
          id: "archiveState",
          label: "archive states",
          options: archiveOptions,
        },
        {
          id: "medium",
          label: "mediums",
          options: mediumOptions,
        },
        {
          id: "status",
          label: "document statuses",
          options: statusOptions,
        },
        {
          id: "category.name",
          label: "categories",
          options: categoryOptions,
        },
      ]}
    />
  );
}
