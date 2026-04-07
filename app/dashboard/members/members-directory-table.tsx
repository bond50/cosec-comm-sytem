"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { OrganizationMembershipListItem } from "@/features/application/queries/memberships";
import { DataTable } from "@/components/ui/data-table";

type MembersDirectoryTableProps = {
  memberships: OrganizationMembershipListItem[];
  canManageMembers: boolean;
};

function getInitials(name: string | null, email: string | null) {
  const source = name?.trim() || email?.trim() || "U";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

export function MembersDirectoryTable({
  memberships,
  canManageMembers,
}: MembersDirectoryTableProps) {
  const roleOptions = Array.from(
    new Set(memberships.map((membership) => membership.role)),
  ).map((role) => ({
    label: role.replaceAll("_", " "),
    value: role,
  }));
  const statusOptions = Array.from(
    new Set(memberships.map((membership) => membership.status)),
  ).map((status) => ({
    label: status,
    value: status,
  }));
  const departmentOptions = Array.from(
    new Set(
      memberships
        .map((membership) => membership.department?.name)
        .filter((department): department is string => Boolean(department)),
    ),
  ).map((department) => ({
    label: department,
    value: department,
  }));

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "ORG_ADMIN":
      case "SUPER_ADMIN":
        return "border-[#d9e2ff] bg-[#eef2ff] text-[#465fff]";
      case "MANAGEMENT":
        return "border-[#f6e3bf] bg-[#fff7e8] text-[#b7791f]";
      case "REGISTRY_OFFICER":
        return "border-[#cce7f6] bg-[#eef7fd] text-[#1f5f99]";
      case "REVIEWING_OFFICER":
        return "border-[#ddd6fe] bg-[#f5f3ff] text-[#6d28d9]";
      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "INACTIVE":
        return "border-slate-200 bg-slate-100 text-slate-600";
      case "SUSPENDED":
        return "border-amber-200 bg-amber-50 text-amber-700";
      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  };

  const columns: ColumnDef<OrganizationMembershipListItem>[] = [
    {
      id: "user.name",
      accessorKey: "user.name",
      header: "User",
      cell: ({ row }) => {
        const membership = row.original;
        const displayName =
          membership.user.name || membership.user.email || membership.userId;

        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
              {getInitials(membership.user.name, membership.user.email)}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-950">{displayName}</div>
              <div className="text-xs text-slate-500">
                {membership.department?.name || "No department assigned"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "user.email",
      accessorKey: "user.email",
      header: "Email",
      cell: ({ row }) => row.original.user.email || "No email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${getRoleBadgeClass(row.original.role)}`}
        >
          {row.original.role.replaceAll("_", " ")}
        </Badge>
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
      id: "department.name",
      accessorKey: "department.name",
      header: "Department",
      cell: ({ row }) => row.original.department?.name || "Not assigned",
    },
    {
      id: "actions",
      header: "Action",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="text-right">
          <Link
            href={`/dashboard/members/${row.original.userId}`}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {canManageMembers ? "Manage member" : "View member"}
          </Link>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={memberships}
      caption="Membership directory"
      searchPlaceholder="Search members..."
      searchableColumns={[
        "user.name",
        "user.email",
        "role",
        "status",
        "department.name",
      ]}
      emptyMessage="No memberships were found for this organization."
      toolbarLabel="Members"
      toolbarFilters={[
        { id: "role", label: "roles", options: roleOptions },
        { id: "status", label: "statuses", options: statusOptions },
        {
          id: "department.name",
          label: "departments",
          options: departmentOptions,
        },
      ]}
    />
  );
}
