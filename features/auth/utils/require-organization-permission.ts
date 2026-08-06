import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getActiveOrganizationMembershipByUserId } from "@/features/auth/queries/organization-membership";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";
import {
  hasCorrespondenceWorkspaceAccess,
  hasDocumentWorkspaceAccess,
  hasFoundationPermission,
  type FoundationPermission,
  hasMeetingWorkspaceAccess,
} from "@/features/auth/utils/role-access";

export type OrganizationAccessContext = {
  userId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  organizationRole: import("@prisma/client").UserRole;
  organizationRoles: import("@prisma/client").UserRole[];
};

export async function requireOrganizationPermission(
  permission: FoundationPermission,
): Promise<OrganizationAccessContext> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new UnauthorizedError();
  }

  const membership = await getActiveOrganizationMembershipByUserId(
    userId,
    session.organization?.id,
  );
  if (!membership?.organization) {
    throw new MissingOrganizationError();
  }

  if (!hasFoundationPermission(membership.roles, permission)) {
    throw new ForbiddenError(
      "Your role does not allow this action in the current organization.",
    );
  }

  return {
    userId,
    organization: membership.organization,
    organizationRole: membership.role,
    organizationRoles: membership.roles,
  };
}

export async function requirePagePermission(
  permission: FoundationPermission,
): Promise<OrganizationAccessContext> {
  try {
    return await requireOrganizationPermission(permission);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/auth/login");
    }

    if (error instanceof MissingOrganizationError) {
      redirect("/dashboard/organization/setup");
    }

    if (error instanceof ForbiddenError) {
      redirect("/dashboard");
    }

    throw error;
  }
}

export async function requireCorrespondenceWorkspaceAccess(): Promise<OrganizationAccessContext> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/login");
  }

  const membership = await getActiveOrganizationMembershipByUserId(
    userId,
    session.organization?.id,
  );

  if (!membership?.organization) {
    redirect("/dashboard/organization/setup");
  }

  if (!hasCorrespondenceWorkspaceAccess(membership.roles)) {
    redirect("/dashboard");
  }

  return {
    userId,
    organization: membership.organization,
    organizationRole: membership.role,
    organizationRoles: membership.roles,
  };
}

export async function requireDocumentWorkspaceAccess(): Promise<OrganizationAccessContext> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/login");
  }

  const membership = await getActiveOrganizationMembershipByUserId(
    userId,
    session.organization?.id,
  );

  if (!membership?.organization) {
    redirect("/dashboard/organization/setup");
  }

  if (!hasDocumentWorkspaceAccess(membership.roles)) {
    redirect("/dashboard");
  }

  return {
    userId,
    organization: membership.organization,
    organizationRole: membership.role,
    organizationRoles: membership.roles,
  };
}

export async function requireMeetingWorkspaceAccess(): Promise<OrganizationAccessContext> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/login");
  }

  const membership = await getActiveOrganizationMembershipByUserId(
    userId,
    session.organization?.id,
  );

  if (!membership?.organization) {
    redirect("/dashboard/organization/setup");
  }

  if (!hasMeetingWorkspaceAccess(membership.roles)) {
    redirect("/dashboard");
  }

  return {
    userId,
    organization: membership.organization,
    organizationRole: membership.role,
    organizationRoles: membership.roles,
  };
}
