import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DepartmentActionLink,
  DepartmentHeadCard,
  DepartmentHero,
  DepartmentMembersCard,
  DepartmentProfileCard,
  DepartmentSummaryCards,
} from "@/app/dashboard/departments/[departmentId]/department-detail-panels";
import { DepartmentEditForm } from "@/app/dashboard/departments/[departmentId]/department-edit-form";
import { getDepartmentMembers } from "@/features/application/queries/department-members";
import { getDepartmentById } from "@/features/application/queries/departments";
import { requirePagePermission } from "@/features/auth/utils/require-organization-permission";
import { hasFoundationPermission } from "@/features/auth/utils/role-access";

type DepartmentDetailPageProps = {
  params: Promise<{
    departmentId: string;
  }>;
  searchParams: Promise<{
    mode?: string;
  }>;
};

export default async function DepartmentDetailPage({
  params,
  searchParams,
}: DepartmentDetailPageProps) {
  const { departmentId } = await params;
  const { mode } = await searchParams;
  const access = await requirePagePermission("departments.view");
  const department = await getDepartmentById(
    departmentId,
    access.organization.id,
  );
  const canManageDepartments = hasFoundationPermission(
    access.organizationRole,
    "departments.manage",
  );
  const showEditPanel = canManageDepartments && mode === "edit";

  if (!department) {
    redirect("/dashboard/departments");
  }

  const members = await getDepartmentMembers(department.id);
  const currentHead = department.headUserId
    ? (members.find((member) => member.userId === department.headUserId) ??
      null)
    : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <DepartmentHero
        department={department}
        eyebrow="Department detail"
        title={department.name}
        description="Review the department structure, current head, and assigned members so routing and accountability remain explicit."
        actions={
          canManageDepartments
            ? [
                {
                  href: `/dashboard/departments/${department.id}?mode=edit`,
                  label: "Edit department",
                  primary: true,
                },
                {
                  href: `/dashboard/departments/${department.id}/members`,
                  label: "Manage members",
                },
                {
                  href: `/dashboard/departments/${department.id}/head`,
                  label: "Assign head",
                },
              ]
            : [
                {
                  href: "/dashboard/departments",
                  label: "Back to departments",
                },
              ]
        }
      />

      <DepartmentSummaryCards
        department={department}
        members={members}
        currentHead={currentHead}
      />

      <div
        className={
          showEditPanel
            ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]"
            : "grid gap-6"
        }
      >
        <section className="grid gap-4">
          <DepartmentProfileCard department={department} />

          <DepartmentHeadCard
            department={department}
            currentHead={currentHead}
            emptyMessage="No department head has been assigned yet."
            staleMessage="A department head is assigned, but that member is not in the current department members list."
          />

          <DepartmentMembersCard
            members={members}
            description="Current members available inside this department for routing and accountability."
            emptyMessage="No members are currently assigned to this department."
          />
        </section>

        {showEditPanel ? (
          <DepartmentEditForm
            department={{
              id: department.id,
              name: department.name,
              code: department.code,
              description: department.description,
              status: department.status,
            }}
          />
        ) : canManageDepartments ? (
          <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
            <CardHeader className="px-6 py-5">
              <CardTitle className="text-[1.05rem] text-slate-950">
                Department actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 px-6 pb-6">
              <DepartmentActionLink
                href={`/dashboard/departments/${department.id}?mode=edit`}
                label="Update department profile"
              />
              <DepartmentActionLink
                href={`/dashboard/departments/${department.id}/members`}
                label="Review and assign members"
              />
              <DepartmentActionLink
                href={`/dashboard/departments/${department.id}/head`}
                label="Assign department head"
              />
              <Link
                href="/dashboard/departments"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Return to department directory
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
