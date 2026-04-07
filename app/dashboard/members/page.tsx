import { MembersList } from "@/app/dashboard/members/members-list";
import { getMembershipsByOrganization } from "@/features/application/queries/memberships";
import { requirePagePermission } from "@/features/auth/utils/require-organization-permission";
import { hasFoundationPermission } from "@/features/auth/utils/role-access";

export default async function MembersPage() {
  const access = await requirePagePermission("members.view");
  const canManageMembers = hasFoundationPermission(
    access.organizationRole,
    "members.manage",
  );

  const memberships = await getMembershipsByOrganization(
    access.organization.id,
  );

  return (
    <MembersList
      organizationName={access.organization.name}
      memberships={memberships}
      canManageMembers={canManageMembers}
    />
  );
}
