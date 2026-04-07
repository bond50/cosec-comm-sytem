import "server-only";

import { MembershipStatus } from "@prisma/client";
import { db } from "@/lib/db";

export async function getActiveOrganizationMembershipByUserId(userId: string) {
  return db.organizationMembership.findFirst({
    where: {
      userId,
      status: MembershipStatus.ACTIVE,
    },
    select: {
      role: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}
