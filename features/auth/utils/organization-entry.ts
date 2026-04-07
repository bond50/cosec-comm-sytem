import "server-only";

import { MembershipStatus } from "@prisma/client";
import { getUserMemberships } from "@/features/application/queries/memberships";

export type OrganizationEntryState =
  | "NO_ORG"
  | "HAS_ORG_SINGLE"
  | "HAS_ORG_MULTIPLE";

export async function resolveOrganizationEntry(
  userId: string,
): Promise<OrganizationEntryState> {
  if (!userId) return "NO_ORG";

  const memberships = await getUserMemberships(userId);
  const activeMembershipCount = memberships.filter(
    (membership) => membership.status === MembershipStatus.ACTIVE,
  ).length;

  if (activeMembershipCount === 0) {
    return "NO_ORG";
  }

  if (activeMembershipCount === 1) {
    return "HAS_ORG_SINGLE";
  }

  return "HAS_ORG_MULTIPLE";
}
