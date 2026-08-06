import { notFound } from "next/navigation";
import {
  MemberManagementPanel,
  MemberReadOnlyPanel,
} from "@/app/dashboard/members/member-management-panel";
import { getDepartmentsByOrganization } from "@/features/application/queries/departments";
import { getMembershipDetailByUserId } from "@/features/application/queries/memberships";
import { requirePagePermission } from "@/features/auth/utils/require-organization-permission";
import { hasFoundationPermission } from "@/features/auth/utils/role-access";

type MemberDetailPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function MemberDetailPage({
  params,
}: MemberDetailPageProps) {
  const access = await requirePagePermission("members.view");
  const { userId } = await params;
  const canManageMembers = hasFoundationPermission(
    access.organizationRoles,
    "members.manage",
  );

  const [member, departments] = await Promise.all([
    getMembershipDetailByUserId(access.organization.id, userId),
    canManageMembers
      ? getDepartmentsByOrganization(access.organization.id)
      : Promise.resolve([]),
  ]);

  if (!member) {
    notFound();
  }

  if (canManageMembers) {
    return <MemberManagementPanel member={member} departments={departments} />;
  }

  return <MemberReadOnlyPanel member={member} />;
}
