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
  hasFoundationPermission,
  type FoundationPermission,
} from "@/features/auth/utils/role-access";

export type OrganizationAccessContext = {
  userId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  organizationRole: import("@prisma/client").UserRole;
};

export async function requireOrganizationPermission(
  permission: FoundationPermission,
): Promise<OrganizationAccessContext> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new UnauthorizedError();
  }

  const membership = await getActiveOrganizationMembershipByUserId(userId);
  if (!membership?.organization) {
    throw new MissingOrganizationError();
  }

  if (!hasFoundationPermission(membership.role, permission)) {
    throw new ForbiddenError(
      "Your role does not allow this action in the current organization.",
    );
  }

  return {
    userId,
    organization: membership.organization,
    organizationRole: membership.role,
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
      redirect("/forbidden");
    }

    throw error;
  }
}
