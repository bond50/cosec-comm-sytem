import { redirect } from "next/navigation";
import {
  DepartmentHeadCard,
  DepartmentHero,
  DepartmentProfileCard,
  DepartmentSummaryCards,
} from "@/app/dashboard/departments/[departmentId]/department-detail-panels";
import { HeadAssignmentForm } from "@/app/dashboard/departments/[departmentId]/head/head-assignment-form";
import { getDepartmentMembers } from "@/features/application/queries/department-members";
import { getDepartmentById } from "@/features/application/queries/departments";
import { requirePagePermission } from "@/features/auth/utils/require-organization-permission";

type DepartmentHeadPageProps = {
  params: Promise<{
    departmentId: string;
  }>;
};

export default async function DepartmentHeadPage({
  params,
}: DepartmentHeadPageProps) {
  const { departmentId } = await params;
  const access = await requirePagePermission("departments.manage");
  const department = await getDepartmentById(
    departmentId,
    access.organization.id,
  );

  if (!department) {
    redirect("/dashboard/departments");
  }

  const candidates = await getDepartmentMembers(department.id);
  const currentHead = department.headUserId
    ? (candidates.find(
        (candidate) => candidate.userId === department.headUserId,
      ) ?? null)
    : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <DepartmentHero
        department={department}
        eyebrow="Department leadership"
        title={`${department.name} head`}
        description="Review the current department head and assign the accountable lead from the department member pool."
        actions={[
          {
            href: `/dashboard/departments/${department.id}`,
            label: "Back to department",
          },
          {
            href: `/dashboard/departments/${department.id}/members`,
            label: "Manage members",
          },
        ]}
      />

      <DepartmentSummaryCards
        department={department}
        members={candidates}
        currentHead={currentHead}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="grid gap-4">
          <DepartmentProfileCard department={department} />

          <DepartmentHeadCard
            department={department}
            currentHead={currentHead}
            emptyMessage="No department head has been assigned yet."
            staleMessage="A department head is assigned, but the member is not currently available in the department member list."
          />
        </section>

        <HeadAssignmentForm
          departmentId={department.id}
          candidates={candidates}
        />
      </div>
    </div>
  );
}
