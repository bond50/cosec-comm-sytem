import { notFound } from "next/navigation";
import { CorrespondenceStatus } from "@prisma/client";
import { CorrespondenceCurrentStepCard } from "@/app/dashboard/correspondences/[id]/correspondence-current-step-card";
import { CorrespondenceDetailTabs } from "@/app/dashboard/correspondences/[id]/correspondence-detail-tabs";
import { CorrespondencePrintView } from "@/app/dashboard/correspondences/[id]/correspondence-print-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CorrespondenceActionLink,
  CorrespondenceAssignmentCard,
  CorrespondenceDispatchCard,
  CorrespondenceAttachmentsCard,
  CorrespondenceAuditCard,
  CorrespondenceHero,
  CorrespondenceMovementCard,
  CorrespondenceRegistrationCard,
  CorrespondenceReviewCard,
  CorrespondenceStatusCard,
  CorrespondenceTopSummaryStrip,
} from "@/app/dashboard/correspondences/[id]/correspondence-detail-panels";
import { getDepartmentsByOrganization } from "@/features/application/queries/departments";
import { getMembershipsByOrganization } from "@/features/application/queries/memberships";
import { requireCorrespondenceWorkspaceAccess } from "@/features/auth/utils/require-organization-permission";
import {
  hasCountySecretaryAuthority,
  hasFoundationPermission,
  hasRegistryDispatchCapability,
} from "@/features/auth/utils/role-access";
import { getCorrespondenceAuditLogs } from "@/features/correspondence/queries/correspondence-audit";
import { getCorrespondenceAssets } from "@/features/correspondence/queries/correspondence-assets";
import { getCorrespondenceDetail } from "@/features/correspondence/queries/correspondence-detail";
import { getCorrespondenceDispatches } from "@/features/correspondence/queries/correspondence-dispatches";
import { getCorrespondenceMovements } from "@/features/correspondence/queries/correspondence-movements";

type CorrespondenceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    print?: string;
  }>;
};

export default async function CorrespondenceDetailPage({
  params,
  searchParams,
}: CorrespondenceDetailPageProps) {
  const access = await requireCorrespondenceWorkspaceAccess();
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const [
    correspondence,
    movements,
    auditLogs,
    assets,
    dispatches,
    departments,
    memberships,
  ] = await Promise.all([
    getCorrespondenceDetail(id, access.organization.id),
    getCorrespondenceMovements(id, access.organization.id),
    getCorrespondenceAuditLogs(id, access.organization.id),
    getCorrespondenceAssets(id, access.organization.id),
    getCorrespondenceDispatches(id, access.organization.id),
    getDepartmentsByOrganization(access.organization.id),
    getMembershipsByOrganization(access.organization.id),
  ]);

  if (!correspondence) {
    notFound();
  }

  if (resolvedSearchParams?.print === "1") {
    return (
      <CorrespondencePrintView
        organizationName={access.organization.name}
        correspondence={correspondence}
        movements={movements}
        dispatches={dispatches}
        auditLogs={auditLogs}
      />
    );
  }

  const hasCountySecretaryPath = hasCountySecretaryAuthority(
    access.organizationRoles,
  );
  const canReview = hasCountySecretaryPath;
  const canAssign = hasCountySecretaryPath;
  const canRegister = hasFoundationPermission(
    access.organizationRoles,
    "correspondence.register",
  );
  const registryDispatchGranted = hasRegistryDispatchCapability(
    access.organizationRoles,
  );
  const canWork = hasFoundationPermission(
    access.organizationRoles,
    "correspondence.work",
  );
  const canClose = hasCountySecretaryPath;
  const canUploadCorrespondenceAttachment =
    canWork &&
    correspondence.status !== CorrespondenceStatus.CLOSED &&
    correspondence.status !== CorrespondenceStatus.CANCELLED;
  const departmentOptions = departments
    .filter((department) => department.status === "ACTIVE")
    .map((department) => ({
      id: department.id,
      label: department.code
        ? `${department.name} (${department.code})`
        : department.name,
    }));
  const assigneeOptions = memberships
    .filter(
      (membership) =>
        membership.status === "ACTIVE" && !!membership.departmentId,
    )
    .map((membership) => ({
      id: membership.userId,
      label:
        membership.user.name ||
        membership.user.email ||
        `Member ${membership.userId.slice(0, 6)}`,
      departmentId: membership.departmentId,
    }));
  const currentUserDepartmentId =
    memberships.find(
      (membership) =>
        membership.userId === access.userId && membership.status === "ACTIVE",
    )?.departmentId ?? null;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <CorrespondenceHero
        correspondence={correspondence}
        dispatches={dispatches}
        organizationName={access.organization.name}
      />

      <CorrespondenceTopSummaryStrip
        correspondence={correspondence}
        dispatches={dispatches}
        movements={movements}
      />

      <CorrespondenceCurrentStepCard
        correspondence={correspondence}
        dispatches={dispatches}
        canReview={canReview}
        canAssign={canAssign}
        canWork={canWork}
        canClose={canClose}
        currentUserId={access.userId}
        currentUserDepartmentId={currentUserDepartmentId}
        departmentOptions={departmentOptions}
        assigneeOptions={assigneeOptions}
      />

      <CorrespondenceMovementCard
        movements={movements}
        senderOffice={correspondence.senderOffice}
        sourceType={correspondence.sourceType}
        sourceDepartment={correspondence.sourceDepartment}
      />

      {(() => {
        const reviewStarted = correspondence.reviewedAt !== null;
        const routingStarted =
          correspondence.assignedToDepartment !== null ||
          correspondence.assignedToUser !== null;
        const closureStarted =
          correspondence.dueDate !== null || correspondence.closedAt !== null;
        const dispatchStarted = dispatches.length > 0;

        return (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <CorrespondenceDetailTabs
              tabs={[
                {
                  id: "details",
                  label: "Details",
                  content: (
                    <div className="space-y-3">
                      <details
                        open
                        className="rounded-2xl border border-[#c7ddea] bg-[#eef7fb] px-4 py-3"
                      >
                        <summary className="cursor-pointer list-none text-sm font-semibold text-[#124f7d] [&::-webkit-details-marker]:hidden">
                          Intake summary
                        </summary>
                        <div className="mt-3">
                          <CorrespondenceRegistrationCard
                            correspondence={correspondence}
                          />
                        </div>
                      </details>
                      {reviewStarted ? (
                        <details className="rounded-2xl border border-[#c7ddea] bg-[#eef7fb] px-4 py-3">
                          <summary className="cursor-pointer list-none text-sm font-semibold text-[#124f7d] [&::-webkit-details-marker]:hidden">
                            Review summary
                          </summary>
                          <div className="mt-3">
                            <CorrespondenceReviewCard
                              correspondence={correspondence}
                              canReview={canReview}
                              showForm={false}
                            />
                          </div>
                        </details>
                      ) : null}
                      {routingStarted ? (
                        <details className="rounded-2xl border border-[#c7ddea] bg-[#eef7fb] px-4 py-3">
                          <summary className="cursor-pointer list-none text-sm font-semibold text-[#124f7d] [&::-webkit-details-marker]:hidden">
                            Routing summary
                          </summary>
                          <div className="mt-3">
                            <CorrespondenceAssignmentCard
                              correspondence={correspondence}
                              canAssign={canAssign}
                              showForm={false}
                              departmentOptions={departmentOptions}
                              assigneeOptions={assigneeOptions}
                            />
                          </div>
                        </details>
                      ) : null}
                      {closureStarted ? (
                        <details className="rounded-2xl border border-[#c7ddea] bg-[#eef7fb] px-4 py-3">
                          <summary className="cursor-pointer list-none text-sm font-semibold text-[#124f7d] [&::-webkit-details-marker]:hidden">
                            Closure summary
                          </summary>
                          <div className="mt-3">
                            <CorrespondenceStatusCard
                              correspondence={correspondence}
                              canClose={canClose}
                              showForm={false}
                            />
                          </div>
                        </details>
                      ) : null}
                    </div>
                  ),
                },
                ...(dispatchStarted
                  ? [
                      {
                        id: "dispatch",
                        label: "Dispatch",
                        content: (
                          <CorrespondenceDispatchCard
                            correspondence={correspondence}
                            dispatches={dispatches}
                            canDispatch={canAssign}
                            showForm={false}
                            canWork={canWork}
                            currentUserId={access.userId}
                            currentUserDepartmentId={currentUserDepartmentId}
                            registryDispatchGranted={registryDispatchGranted}
                          />
                        ),
                      },
                    ]
                  : []),
                {
                  id: "files",
                  label: "Files",
                  content: (
                    <CorrespondenceAttachmentsCard
                      correspondence={correspondence}
                      attachments={assets.attachments}
                      linkedDocuments={assets.linkedDocuments}
                      linkedMeetings={assets.linkedMeetings}
                      canUpload={canUploadCorrespondenceAttachment}
                    />
                  ),
                },
                {
                  id: "audit",
                  label: "Audit",
                  content: <CorrespondenceAuditCard auditLogs={auditLogs} />,
                },
              ]}
            />

            <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
              <Card className="rounded-2xl border-[#c7ddea] bg-[#f3f9fc] shadow-sm">
                <CardHeader className="px-6 py-5">
                  <CardTitle className="text-[1.05rem] text-slate-950">
                    File shortcuts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-6 pb-6">
                  <CorrespondenceActionLink
                    href="/dashboard/correspondences"
                    icon="list"
                    label="Back to correspondence"
                    description="Return to the correspondence register and filters."
                  />
                  <CorrespondenceActionLink
                    href={`/dashboard/correspondences/${correspondence.id}?print=1`}
                    icon="print"
                    label="Print office copy"
                    description="Open a print-friendly file summary for office records."
                  />
                  {canRegister ? (
                    <CorrespondenceActionLink
                      href="/dashboard/correspondences/register"
                      icon="register"
                      label="Register new correspondence"
                      description="Open the intake form for a new incoming correspondence."
                    />
                  ) : null}
                  {correspondence.assignedToUser ? (
                    <CorrespondenceActionLink
                      href={`/dashboard/members/${correspondence.assignedToUser.id}`}
                      icon="member"
                      label="Open receiving officer"
                      description="View the member profile for the named receiving officer."
                    />
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
