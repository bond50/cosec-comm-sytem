import { redirect } from "next/navigation";
import {
  DepartmentHero,
  DepartmentMembersCard,
  DepartmentProfileCard,
  DepartmentSummaryCards,
} from "@/app/dashboard/departments/[departmentId]/department-detail-panels";
import { MemberAssignmentForm } from "@/app/dashboard/departments/[departmentId]/members/member-assignment-form";
import { getDepartmentMembers } from "@/features/application/queries/department-members";
import { getDepartmentById } from "@/features/application/queries/departments";
import { getAssignableDepartmentHeadCandidates } from "@/features/application/queries/memberships";
import { requirePagePermission } from "@/features/auth/utils/require-organization-permission";

type DepartmentMembersPageProps = {
  params: Promise<{
    departmentId: string;
  }>;
};

export default async function DepartmentMembersPage({
  params,
}: DepartmentMembersPageProps) {
  const { departmentId } = await params;
  const access = await requirePagePermission("departments.manage");
  const department = await getDepartmentById(
    departmentId,
    access.organization.id,
  );

  if (!department) {
    redirect("/dashboard/departments");
  }

  const [members, candidates] = await Promise.all([
    getDepartmentMembers(department.id),
    getAssignableDepartmentHeadCandidates(access.organization.id),
  ]);
  const currentHead = department.headUserId
    ? (members.find((member) => member.userId === department.headUserId) ??
      null)
    : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <DepartmentHero
        department={department}
        eyebrow="Department members"
        title={`${department.name} members`}
        description="Assign and review the members currently attached to this department so operational ownership stays explicit."
        actions={[
          {
            href: `/dashboard/departments/${department.id}`,
            label: "Back to department",
          },
          {
            href: `/dashboard/departments/${department.id}/head`,
            label: "Assign head",
          },
        ]}
      />

      <DepartmentSummaryCards
        department={department}
        members={members}
        currentHead={currentHead}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="grid gap-4">
          <DepartmentProfileCard department={department} />

          <DepartmentMembersCard
            title="Current members"
            description="Assigned members available for work, routing, and departmental accountability."
            members={members}
            emptyMessage="No members are currently assigned to this department."
          />
        </section>

        <MemberAssignmentForm
          departmentId={department.id}
          candidates={candidates}
        />
      </div>
    </div>
  );
}
