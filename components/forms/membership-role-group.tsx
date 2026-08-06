"use client";

import { UserRole } from "@prisma/client";
import { FieldError, FieldLabel } from "@/components/ui/field";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { getRoleLabel } from "@/features/auth/utils/role-access";

type MembershipRoleGroupProps = {
  idPrefix: string;
  label?: string;
  roles: readonly UserRole[];
  selectedRoles: UserRole[];
  error?: string;
  hint?: string;
  guidanceByRole?: Partial<Record<UserRole, string>>;
};

export function MembershipRoleGroup({
  idPrefix,
  label = "Membership roles",
  roles,
  selectedRoles,
  error,
  hint,
  guidanceByRole,
}: MembershipRoleGroupProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <FieldLabel required>{label}</FieldLabel>
        {hint ? <InfoTooltip text={hint} /> : null}
      </div>
      <div className="grid gap-3">
        {roles.map((role) => {
          const id = `${idPrefix}-${role.toLowerCase()}`;

          return (
            <label
              key={role}
              htmlFor={id}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              <input
                id={id}
                type="checkbox"
                name="roles"
                value={role}
                defaultChecked={selectedRoles.includes(role)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1868a6] focus:ring-[#1868a6]"
              />
              <div className="space-y-1">
                <div className="font-semibold text-slate-950">
                  {getRoleLabel(role)}
                </div>
                <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
                  {role.replaceAll("_", " ")}
                </div>
                {guidanceByRole?.[role] ? (
                  <div className="text-xs leading-5 text-slate-500">
                    {guidanceByRole[role]}
                  </div>
                ) : null}
              </div>
            </label>
          );
        })}
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}
