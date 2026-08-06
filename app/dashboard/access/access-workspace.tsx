"use client";

import { useMemo, useState } from "react";
import type { UserRole } from "@prisma/client";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  FolderKanban,
  Route,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";

type RoleDefinition = {
  role: UserRole;
  label: string;
  summary: string;
  responsibilities: string[];
};

type AccessMapEntry = {
  kind: string;
  target: string;
  permission: string;
  description: string;
  allowedRoles?: UserRole[] | null;
};

type AccessWorkspaceProps = {
  organizationName: string;
  currentRole: UserRole;
  visiblePermissionsCount: number;
  currentRoleSummary: string;
  roleDefinitions: RoleDefinition[];
  permissionRows: Array<{
    permission: string;
    label: string;
    roles: UserRole[];
  }>;
  accessMap: AccessMapEntry[];
  roleLabels: Record<UserRole, string>;
  roleBadgeTone: Record<UserRole, string>;
  rolePanelTone: Record<UserRole, string>;
};

type AccessView = "roles" | "permissions" | "mapping";

function getRolePlacement(role: UserRole) {
  switch (role) {
    case "REGISTRY_OFFICER":
    case "REVIEWING_OFFICER":
    case "MANAGEMENT":
    case "ORG_ADMIN":
    case "SUPER_ADMIN":
      return "Central office";
    case "DEPARTMENT_USER":
      return "Execution department";
    default:
      return "Limited assignment role";
  }
}

function getRoleAccessNote(role: UserRole) {
  switch (role) {
    case "REGISTRY_OFFICER":
      return "Receives and registers incoming correspondence for the central office.";
    case "REVIEWING_OFFICER":
      return "Does the day-to-day County Secretary workflow work: review, instruction, routing, dispatch, and closure.";
    case "MANAGEMENT":
      return "Represents the same County Secretary authority path at oversight level when the office wants that role shown separately.";
    case "DEPARTMENT_USER":
      return "Works on items dispatched to a department and submits feedback.";
    case "ORG_ADMIN":
      return "Maintains members, departments, and county workspace structure.";
    case "SUPER_ADMIN":
      return "Reserved for exceptional support and recovery.";
    default:
      return "Constrained participation role with limited county workflow access.";
  }
}

export function AccessWorkspace({
  organizationName,
  currentRole,
  visiblePermissionsCount,
  currentRoleSummary,
  roleDefinitions,
  permissionRows,
  accessMap,
  roleLabels,
  roleBadgeTone,
  rolePanelTone,
}: AccessWorkspaceProps) {
  const [activeView, setActiveView] = useState<AccessView>("roles");
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);

  const selectedRoleDefinition = useMemo(
    () =>
      roleDefinitions.find((definition) => definition.role === selectedRole) ??
      roleDefinitions[0],
    [roleDefinitions, selectedRole],
  );

  const filteredPermissionRows = useMemo(
    () =>
      permissionRows.filter((row) =>
        row.roles.includes(selectedRoleDefinition.role),
      ),
    [permissionRows, selectedRoleDefinition.role],
  );

  const filteredAccessMap = useMemo(
    () =>
      accessMap.filter((entry) =>
        entry.allowedRoles?.length
          ? entry.allowedRoles.includes(selectedRoleDefinition.role)
          : true,
      ),
    [accessMap, selectedRoleDefinition.role],
  );

  const selectedPages = useMemo(
    () => filteredAccessMap.filter((entry) => entry.kind === "page"),
    [filteredAccessMap],
  );

  const selectedActions = useMemo(
    () => filteredAccessMap.filter((entry) => entry.kind === "action"),
    [filteredAccessMap],
  );

  const roleMatrixRows = useMemo(
    () =>
      roleDefinitions.map((definition) => {
        const entries = accessMap.filter((entry) =>
          entry.allowedRoles?.length
            ? entry.allowedRoles.includes(definition.role)
            : true,
        );

        return {
          role: definition.role,
          label: definition.label,
          summary: definition.summary,
          pages: entries.filter((entry) => entry.kind === "page"),
          actions: entries.filter((entry) => entry.kind === "action"),
        };
      }),
    [accessMap, roleDefinitions],
  );

  const viewButtonClass = (view: AccessView) =>
    cn(
      "inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition",
      activeView === view
        ? "border-[#1868a6] bg-[#1868a6] text-white"
        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header className="grid items-start gap-5 rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm xl:grid-cols-[minmax(0,1.45fr)_340px]">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Roles and permissions
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-slate-950">
                Roles & access
              </h1>
              <InfoTooltip text="This page explains who does what in the county workflow, what each role is allowed to open, and where authority sits between the central office and execution departments." />
            </div>
            <p className="text-sm font-medium leading-6 text-slate-700">
              Access model for {organizationName}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={viewButtonClass("roles")}
              onClick={() => setActiveView("roles")}
            >
              Role guide
            </button>
            <button
              type="button"
              className={viewButtonClass("permissions")}
              onClick={() => setActiveView("permissions")}
            >
              Allowed pages
            </button>
            <button
              type="button"
              className={viewButtonClass("mapping")}
              onClick={() => setActiveView("mapping")}
            >
              Rules and mapping
            </button>
          </div>
        </div>

        <div
          className={cn("rounded-2xl border p-5", rolePanelTone[currentRole])}
        >
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Current role
            </p>
            <InfoTooltip text="Effective access comes from the assigned membership role set. This card shows your current primary role." />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className={cn(
                "px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em]",
                roleBadgeTone[currentRole],
              )}
            >
              Role: {roleLabels[currentRole]}
            </Badge>
            <span className="text-sm text-slate-600">
              {visiblePermissionsCount} foundation permissions
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            {currentRoleSummary}
          </p>
        </div>
      </header>

      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[#1868a6]" />
          <span className="text-sm font-medium text-slate-700">
            Central office roles
          </span>
          <InfoTooltip text="Registry Officer, Reviewing Officer, Management, and most Org Admin work sit in the Office of the County Secretary and Head of Public Service." />
        </div>
        <span className="text-slate-300">·</span>
        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="h-4 w-4 text-[#2c6b43]" />
          <span className="text-sm font-medium text-slate-700">
            Execution departments
          </span>
          <InfoTooltip text="Department User works on correspondence after the central office reviews and dispatches it to a department." />
        </div>
        <span className="text-slate-300">·</span>
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4 text-[#9a5c10]" />
          <span className="text-sm font-medium text-slate-700">
            Workflow rule
          </span>
          <InfoTooltip text="Correspondence should move through the central office path: receive, register, review, dispatch, work, feedback, then close." />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Filter by role
          </p>
          <div className="mt-4 space-y-2">
            {roleDefinitions.map((definition) => (
              <button
                key={definition.role}
                type="button"
                onClick={() => setSelectedRole(definition.role)}
                className={cn(
                  "flex w-full flex-col items-start rounded-xl border px-4 py-3 text-left transition",
                  selectedRole === definition.role
                    ? "border-[#1868a6] bg-[#e6f1f8]"
                    : "border-slate-200 bg-white hover:bg-slate-50",
                )}
              >
                <span className="text-sm font-semibold text-slate-950">
                  {definition.label}
                </span>
                <span className="mt-1 text-xs leading-5 text-slate-500">
                  {definition.summary}
                </span>
              </button>
            ))}
          </div>
        </div>

        {activeView === "roles" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-slate-950">
                  {selectedRoleDefinition.label}
                </h2>
                <Badge
                  variant="outline"
                  className={cn(
                    "px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em]",
                    roleBadgeTone[selectedRole],
                  )}
                >
                  {getRolePlacement(selectedRole)}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {selectedRoleDefinition.summary}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <div className="flex items-center gap-1.5 text-sm text-slate-700">
                  <Users className="h-4 w-4 text-slate-500" />
                  <span className="font-medium">
                    {getRolePlacement(selectedRole)}
                  </span>
                  <InfoTooltip text="Where this role belongs in the county workflow." />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-700">
                  <ShieldCheck className="h-4 w-4 text-slate-500" />
                  <span className="font-medium">Main purpose</span>
                  <InfoTooltip text={getRoleAccessNote(selectedRole)} />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-700">
                  <BadgeCheck className="h-4 w-4 text-slate-500" />
                  <span className="font-medium">
                    {selectedPages.length} page
                    {selectedPages.length === 1 ? "" : "s"} ·{" "}
                    {selectedActions.length} action
                    {selectedActions.length === 1 ? "" : "s"}
                  </span>
                  <InfoTooltip text="Current access scope in the system for this role." />
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-950">
                  What this role is responsible for
                </h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {selectedRoleDefinition.responsibilities.map(
                    (responsibility) => (
                      <li
                        key={responsibility}
                        className="flex items-start gap-2"
                      >
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                        <span>{responsibility}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4">
                <h3 className="text-sm font-semibold text-slate-950">
                  Compare all roles
                </h3>
              </div>
              <ul className="divide-y divide-slate-200">
                {roleMatrixRows.map((row) => {
                  const isSelected = row.role === selectedRole;

                  return (
                    <li
                      key={row.role}
                      className={cn(
                        "flex flex-wrap items-center justify-between gap-3 px-6 py-3 transition",
                        isSelected && "bg-[#f8faff]",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em]",
                            roleBadgeTone[row.role],
                          )}
                        >
                          {row.label}
                        </Badge>
                        <span className="truncate text-sm text-slate-600">
                          {row.summary}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <FolderKanban className="h-3.5 w-3.5" />
                          {row.pages.length}
                          <InfoTooltip
                            text={
                              row.pages
                                .map((entry) => entry.target)
                                .join(", ") || "No pages assigned."
                            }
                          />
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {row.actions.length}
                          <InfoTooltip
                            text={
                              row.actions
                                .map((entry) => entry.target)
                                .join(", ") || "No actions assigned."
                            }
                          />
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRole(row.role);
                            setActiveView("permissions");
                          }}
                          className="text-xs font-medium text-[#1868a6] hover:text-[#3147d8]"
                        >
                          View what this role can open
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : null}

        {activeView === "permissions" ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-semibold text-slate-950">
                What {selectedRoleDefinition.label} can open
              </h2>
            </div>

            <div className="grid gap-4 border-b border-slate-200 px-6 py-5 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <h3 className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-950">
                  Allowed pages
                </h3>
                <ul className="divide-y divide-slate-100">
                  {selectedPages.map((entry) => (
                    <li key={entry.target} className="flex gap-3 px-4 py-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e6f1f8] text-[#1868a6]">
                        <FolderKanban className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm leading-6 text-slate-700">
                          {entry.description}
                        </p>
                        <span className="mt-1 inline-block max-w-full break-all rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[0.68rem] text-slate-500">
                          {entry.target}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <h3 className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-950">
                  Allowed actions
                </h3>
                <ul className="divide-y divide-slate-100">
                  {selectedActions.map((entry) => (
                    <li key={entry.target} className="flex gap-3 px-4 py-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eff8f2] text-[#2c6b43]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm leading-6 text-slate-700">
                          {entry.description}
                        </p>
                        <span className="mt-1 inline-block max-w-full break-all rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[0.68rem] text-slate-500">
                          {entry.target}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-slate-50/90">
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Permission
                    </th>
                    <th className="px-6 py-4 text-left text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Allowed roles
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPermissionRows.map((row) => (
                    <tr
                      key={row.permission}
                      className="border-b border-slate-200"
                    >
                      <td className="px-6 py-4 font-medium text-slate-950">
                        {row.permission}
                      </td>
                      <td className="px-6 py-4 leading-6 text-slate-600">
                        {row.label}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {row.roles.map((role) => (
                            <Badge
                              key={`${row.permission}-${role}`}
                              variant="outline"
                              className={cn(
                                "px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em]",
                                roleBadgeTone[role],
                              )}
                            >
                              {roleLabels[role]}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {activeView === "mapping" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">
                County access rules
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <h3 className="text-sm font-semibold text-slate-950">
                    Role assignment rule
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    A member may hold more than one role, but the department
                    decides which roles are valid. Central-office roles stay in
                    the central office. Execution departments use `Department
                    User`.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <h3 className="text-sm font-semibold text-slate-950">
                    Authority rule
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    `Reviewing Officer` is the main working role for the County
                    Secretary path. `Management` is the oversight label for that
                    same path when assigned. `Registry Officer` handles intake
                    by default.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-xl font-semibold text-slate-950">
                  Page and action mapping for {selectedRoleDefinition.label}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-slate-50/90">
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-4 text-left text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Target
                      </th>
                      <th className="px-6 py-4 text-left text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Permission
                      </th>
                      <th className="px-6 py-4 text-left text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccessMap.map((entry) => (
                      <tr
                        key={`${entry.kind}-${entry.target}`}
                        className="border-b border-slate-200"
                      >
                        <td className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className="px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-600"
                          >
                            {entry.kind}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-950">
                          {entry.target}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {entry.permission}
                        </td>
                        <td className="px-6 py-4 leading-6 text-slate-600">
                          {entry.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
