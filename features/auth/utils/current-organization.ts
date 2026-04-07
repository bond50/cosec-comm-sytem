import "server-only";

import { auth } from "@/auth";
import { getActiveMembershipByUserId } from "@/features/application/queries/memberships";
import type { Organization } from "@prisma/client";
import {
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";

export async function getCurrentOrganization(): Promise<Organization | null> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const membership = await getActiveMembershipByUserId(userId);
  return membership?.organization ?? null;
}

export async function requireCurrentOrganization(): Promise<Organization> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  const organization = await getCurrentOrganization();
  if (!organization) {
    throw new MissingOrganizationError();
  }

  return organization;
}
