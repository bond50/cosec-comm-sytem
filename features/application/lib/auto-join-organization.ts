import "server-only";

import { MembershipStatus, UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { getSoleOrganization } from "@/features/application/queries/organizations";

/**
 * This deployment is single-organization: once the first user creates the
 * organization via the setup wizard, every later account should join it
 * automatically as a regular member instead of being asked to set up
 * another organization.
 */
export async function autoJoinSoleOrganization(userId: string): Promise<void> {
  try {
    const existingMembership = await db.organizationMembership.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (existingMembership) return;

    const organization = await getSoleOrganization();
    if (!organization) return;

    await db.organizationMembership.create({
      data: {
        organizationId: organization.id,
        userId,
        role: UserRole.USER,
        roles: [UserRole.USER],
        status: MembershipStatus.ACTIVE,
      },
    });
  } catch (error) {
    console.error("autoJoinSoleOrganization failed", error);
  }
}
