"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, PencilLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MemberDetailsCard,
  UpdateMemberForm,
} from "@/app/dashboard/members/member-management-panel";
import { getRoleLabel, getRoleLabels } from "@/features/auth/utils/role-access";
import { resolvePrimaryRole } from "@/features/auth/utils/roles";
import type { DepartmentSummary } from "@/features/application/queries/departments";
import type { OrganizationMembershipListItem } from "@/features/application/queries/memberships";
import { formatUserLabel } from "@/features/application/lib/user-label";

type MembersDirectoryTableProps = {
  memberships: OrganizationMembershipListItem[];
  canManageMembers: boolean;
  departments: DepartmentSummary[];
  toolbarPrimaryAction?: React.ReactNode;
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
  departments,
  toolbarPrimaryAction,
}: MembersDirectoryTableProps) {
  const [viewMember, setViewMember] =
    useState<OrganizationMembershipListItem | null>(null);
  const [editMember, setEditMember] =
    useState<OrganizationMembershipListItem | null>(null);
  const roleOptions = Array.from(
    new Set(
      memberships.flatMap((membership) =>
        membership.roles.map((role) => role.replaceAll("_", " ")),
      ),
    ),
  ).map((roleLabel) => ({
    label: roleLabel,
    value: roleLabel,
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
        return "border-[#d9e2ff] bg-[#e6f1f8] text-[#1868a6]";
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
        const displayName = formatUserLabel(membership.user, membership.userId);

        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-[0.7rem] font-semibold text-slate-700">
              {getInitials(membership.user.name, membership.user.email)}
            </div>
            <div className="min-w-0 truncate font-semibold text-slate-950">
              {displayName}
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
      id: "roleSummary",
      accessorFn: (row) => getRoleLabels(row.roles).join(", "),
      header: "Role",
      cell: ({ row }) => {
        const primaryRole =
          resolvePrimaryRole(row.original.roles) ?? row.original.role;
        const primaryLabel = getRoleLabel(primaryRole);
        const extraLabels = getRoleLabels(row.original.roles).filter(
          (label) => label !== primaryLabel,
        );

        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <Badge
              variant="outline"
              className={`px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${getRoleBadgeClass(primaryRole)}`}
            >
              {primaryLabel}
            </Badge>
            {extraLabels.length ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="border-slate-200 bg-slate-50 px-2 py-1 text-[0.68rem] font-semibold text-slate-500"
                  >
                    +{extraLabels.length}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>{extraLabels.join(", ")}</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        );
      },
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
      cell: ({ row }) => row.original.department?.name || "Department required",
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setViewMember(row.original)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            aria-label={`View ${formatUserLabel(row.original.user, "member")}`}
            title="View member"
          >
            <Eye className="h-4 w-4 text-slate-400" />
          </button>
          {canManageMembers ? (
            <button
              type="button"
              onClick={() => setEditMember(row.original)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              aria-label={`Edit ${formatUserLabel(row.original.user, "member")}`}
              title="Edit member"
            >
              <PencilLine className="h-4 w-4 text-slate-500" />
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={memberships}
        caption="Membership directory"
        searchPlaceholder="Search members..."
        searchableColumns={[
          "user.name",
          "user.email",
          "roleSummary",
          "status",
          "department.name",
        ]}
        emptyMessage="No memberships were found for this organization."
        toolbarLabel="Members"
        toolbarPrimaryAction={toolbarPrimaryAction}
        toolbarFilters={[
          { id: "roleSummary", label: "roles", options: roleOptions },
          { id: "status", label: "statuses", options: statusOptions },
          {
            id: "department.name",
            label: "departments",
            options: departmentOptions,
          },
        ]}
      />

      <Dialog
        open={!!viewMember}
        onOpenChange={(open) => !open && setViewMember(null)}
      >
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle>Member details</DialogTitle>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
            {viewMember ? <MemberDetailsCard member={viewMember} /> : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editMember}
        onOpenChange={(open) => !open && setEditMember(null)}
      >
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle>Update member</DialogTitle>
            <DialogDescription>
              Update identity, department, status, and roles.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
            {editMember ? (
              <UpdateMemberForm
                member={editMember}
                departments={departments}
                onSuccess={() => setEditMember(null)}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
