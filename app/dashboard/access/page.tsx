import { UserRole } from "@prisma/client";
import { AccessWorkspace } from "@/app/dashboard/access/access-workspace";
import { requirePagePermission } from "@/features/auth/utils/require-organization-permission";
import {
  FOUNDATION_ACCESS_MAP,
  FOUNDATION_PERMISSION_LABELS,
  FOUNDATION_PERMISSION_ROLES,
  ROLE_DEFINITIONS,
  hasFoundationPermission,
} from "@/features/auth/utils/role-access";

export default async function AccessPage() {
  const access = await requirePagePermission("access.view");
  const currentRole = access.organizationRole;
  const roleDefinition = ROLE_DEFINITIONS.find(
    (definition) => definition.role === currentRole,
  );
  const visiblePermissions = Object.entries(
    FOUNDATION_PERMISSION_LABELS,
  ).filter(([permission]) =>
    hasFoundationPermission(
      currentRole,
      permission as keyof typeof FOUNDATION_PERMISSION_LABELS,
    ),
  );

  const roleTone: Record<UserRole, { badge: string; panel: string }> = {
    SUPER_ADMIN: {
      badge: "border-[#c9d8ff] bg-[#eef3ff] text-[#3156b8]",
      panel: "border-[#d8e3ff] bg-[#f7f9ff]",
    },
    ORG_ADMIN: {
      badge: "border-[#c7e0ff] bg-[#edf6ff] text-[#1f5f99]",
      panel: "border-[#d9e9fb] bg-[#f8fbff]",
    },
    REGISTRY_OFFICER: {
      badge: "border-[#cbe7ea] bg-[#eef9fb] text-[#1f6d77]",
      panel: "border-[#dceef1] bg-[#f8fcfd]",
    },
    REVIEWING_OFFICER: {
      badge: "border-[#ddd6fe] bg-[#f5f3ff] text-[#5b4bb7]",
      panel: "border-[#e5dfff] bg-[#faf9ff]",
    },
    DEPARTMENT_USER: {
      badge: "border-[#cde5d5] bg-[#eff8f2] text-[#2c6b43]",
      panel: "border-[#dceddf] bg-[#f8fcf9]",
    },
    MANAGEMENT: {
      badge: "border-[#f1d7b7] bg-[#fff6eb] text-[#9a5c10]",
      panel: "border-[#f4e1c8] bg-[#fffaf4]",
    },
    USER: {
      badge: "border-slate-200 bg-slate-100 text-slate-700",
      panel: "border-slate-200 bg-slate-50/70",
    },
  };

  return (
    <AccessWorkspace
      organizationName={access.organization.name}
      currentRole={currentRole}
      visiblePermissionsCount={visiblePermissions.length}
      currentRoleSummary={roleDefinition?.summary ?? ""}
      roleDefinitions={ROLE_DEFINITIONS}
      permissionRows={Object.entries(FOUNDATION_PERMISSION_LABELS).map(
        ([permission, label]) => ({
          permission,
          label,
          roles:
            FOUNDATION_PERMISSION_ROLES[
              permission as keyof typeof FOUNDATION_PERMISSION_ROLES
            ],
        }),
      )}
      accessMap={FOUNDATION_ACCESS_MAP}
      roleLabels={
        Object.fromEntries(
          ROLE_DEFINITIONS.map((definition) => [
            definition.role,
            definition.label,
          ]),
        ) as Record<UserRole, string>
      }
      roleBadgeTone={
        Object.fromEntries(
          Object.entries(roleTone).map(([role, tone]) => [role, tone.badge]),
        ) as Record<UserRole, string>
      }
      rolePanelTone={
        Object.fromEntries(
          Object.entries(roleTone).map(([role, tone]) => [role, tone.panel]),
        ) as Record<UserRole, string>
      }
    />
  );
}
