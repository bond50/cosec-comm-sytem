import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    access.organizationRole,
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

  return (
    <div className="flex flex-col gap-6">
      <MemberReadOnlyPanel member={member} />
      <Card className="mx-auto w-full max-w-6xl rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <CardHeader className="px-6 py-5">
          <CardTitle className="text-[1.05rem] text-slate-950">
            Member access
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 text-sm leading-6 text-slate-600">
          Your role can review member records, but only organization
          administrators can change member identity, role, status, or department
          assignment.
        </CardContent>
      </Card>
    </div>
  );
}
