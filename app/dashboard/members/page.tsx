import { MembersWorkspace } from "@/app/dashboard/members/members-workspace";
import { getDepartmentsByOrganization } from "@/features/application/queries/departments";
import { getMembershipsByOrganization } from "@/features/application/queries/memberships";
import { getUsersForSelect } from "@/features/auth/queries/user";
import { requirePagePermission } from "@/features/auth/utils/require-organization-permission";
import { hasFoundationPermission } from "@/features/auth/utils/role-access";

type MembersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const access = await requirePagePermission("members.view");
  const params = (await searchParams) ?? {};
  const createParam = params.create;
  const initialCreateOpen =
    createParam === "1" ||
    createParam === "true" ||
    (Array.isArray(createParam) &&
      createParam.some((value) => value === "1" || value === "true"));
  const canManageMembers = hasFoundationPermission(
    access.organizationRoles,
    "members.manage",
  );

  const [memberships, departments, users] = await Promise.all([
    getMembershipsByOrganization(access.organization.id),
    getDepartmentsByOrganization(access.organization.id),
    getUsersForSelect(),
  ]);
  const existingUserIds = new Set(
    memberships.map((membership) => membership.userId),
  );
  const availableUsers = users.filter((user) => !existingUserIds.has(user.id));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-[1.4rem]">
          Manage members
        </h1>
        <p className="text-sm text-slate-600">
          Memberships for {access.organization.name}.
        </p>
      </header>

      <MembersWorkspace
        memberships={memberships}
        canManageMembers={canManageMembers}
        departments={departments}
        availableUsers={availableUsers}
        initialCreateOpen={initialCreateOpen}
      />
    </div>
  );
}
