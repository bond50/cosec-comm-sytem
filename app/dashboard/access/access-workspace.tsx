"use client";

import { useMemo, useState } from "react";
import type { UserRole } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
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
        ? "border-[#465fff] bg-[#465fff] text-white"
        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header className="grid gap-5 rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm xl:grid-cols-[minmax(0,1.45fr)_340px]">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Roles and permissions
          </div>
          <div className="space-y-2">
            <h1 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-slate-950">
              Roles & access
            </h1>
            <p className="text-sm font-medium leading-6 text-slate-700">
              Access model for {organizationName}
            </p>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Review which roles can govern the organization foundation layer,
              compare permissions, and inspect how current pages map to the
              access model.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={viewButtonClass("roles")}
              onClick={() => setActiveView("roles")}
            >
              Role profiles
            </button>
            <button
              type="button"
              className={viewButtonClass("permissions")}
              onClick={() => setActiveView("permissions")}
            >
              Permission matrix
            </button>
            <button
              type="button"
              className={viewButtonClass("mapping")}
              onClick={() => setActiveView("mapping")}
            >
              Page mapping
            </button>
          </div>
        </div>

        <div
          className={cn("rounded-2xl border p-5", rolePanelTone[currentRole])}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Current role
          </p>
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
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Dashboard permissions, page access, and admin actions all follow
            this role.
          </p>
        </div>
      </header>

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
                    ? "border-[#465fff] bg-[#eef2ff]"
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
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-slate-950">
                  Role matrix
                </h2>
                <Badge
                  variant="outline"
                  className={cn(
                    "px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em]",
                    roleBadgeTone[selectedRole],
                  )}
                >
                  Focus role: {roleLabels[selectedRole]}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                One row per role, with the pages each role can open and the
                actions each role can perform in the current county foundation
                phase.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-slate-50/90">
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Summary
                    </th>
                    <th className="px-6 py-4 text-left text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Pages
                    </th>
                    <th className="px-6 py-4 text-left text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roleMatrixRows.map((row) => {
                    const isSelected = row.role === selectedRole;

                    return (
                      <tr
                        key={row.role}
                        className={cn(
                          "border-b border-slate-200 align-top",
                          isSelected && "bg-[#f8faff]",
                        )}
                      >
                        <td className="px-6 py-5">
                          <div className="space-y-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em]",
                                roleBadgeTone[row.role],
                              )}
                            >
                              {row.label}
                            </Badge>
                            <div>
                              <button
                                type="button"
                                onClick={() => setSelectedRole(row.role)}
                                className="text-xs font-medium text-[#465fff] hover:text-[#3147d8]"
                              >
                                Focus this role
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 leading-6 text-slate-600">
                          {row.summary}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-wrap gap-2">
                            {row.pages.map((entry) => (
                              <Badge
                                key={`${row.role}-${entry.target}`}
                                variant="outline"
                                className="border-slate-200 bg-slate-50 px-3 py-1 text-[0.68rem] font-semibold text-slate-700"
                              >
                                {entry.target}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-wrap gap-2">
                            {row.actions.map((entry) => (
                              <Badge
                                key={`${row.role}-${entry.target}`}
                                variant="outline"
                                className="border-slate-200 bg-white px-3 py-1 text-[0.68rem] font-semibold text-slate-700"
                              >
                                {entry.target}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {activeView === "permissions" ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-semibold text-slate-950">
                Permission matrix for {selectedRoleDefinition.label}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Only permissions available to the selected role are shown here.
              </p>
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
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-semibold text-slate-950">
                Page and action mapping for {selectedRoleDefinition.label}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This view narrows the current pages and actions to the selected
                role.
              </p>
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
        ) : null}
      </section>
    </div>
  );
}
