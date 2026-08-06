import "server-only";

import type { Prisma, UserRole } from "@prisma/client";

export type NotificationRecipient = {
  userId: string;
  email: string | null;
  roles?: UserRole[] | null;
  departmentId?: string | null;
};

type ActiveMembershipRecipient = {
  userId: true;
  departmentId: true;
  roles: true;
  user: {
    select: {
      email: true;
    };
  };
};

type NotificationRoutingContext = {
  tx: Prisma.TransactionClient;
  organizationId: string;
};

function mapMembershipRecipient(
  membership: Prisma.OrganizationMembershipGetPayload<{
    select: ActiveMembershipRecipient;
  }>,
): NotificationRecipient {
  return {
    userId: membership.userId,
    email: membership.user.email,
    roles: membership.roles,
    departmentId: membership.departmentId ?? null,
  };
}

async function getActiveMembershipRecipients(
  { tx, organizationId }: NotificationRoutingContext,
  where: Omit<
    Prisma.OrganizationMembershipWhereInput,
    "organizationId" | "status"
  >,
) {
  const memberships = await tx.organizationMembership.findMany({
    where: {
      organizationId,
      status: "ACTIVE",
      ...where,
    },
    select: {
      userId: true,
      departmentId: true,
      roles: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  return memberships.map(mapMembershipRecipient);
}

export async function getRoleRecipients(
  context: NotificationRoutingContext,
  roles: UserRole[],
) {
  return getActiveMembershipRecipients(context, {
    roles: {
      hasSome: roles,
    },
  });
}

export async function getRegistryRecipients(
  context: NotificationRoutingContext,
) {
  return getRoleRecipients(context, ["REGISTRY_OFFICER"]);
}

export async function getReviewAuthorityRecipients(
  context: NotificationRoutingContext,
) {
  return getRoleRecipients(context, [
    "SUPER_ADMIN",
    "REVIEWING_OFFICER",
    "MANAGEMENT",
  ]);
}

export async function getDepartmentRecipients(
  context: NotificationRoutingContext,
  departmentId: string | null | undefined,
) {
  if (!departmentId) return [];

  return getActiveMembershipRecipients(context, {
    departmentId,
  });
}

export async function getDirectUserRecipient(
  context: NotificationRoutingContext,
  userId: string | null | undefined,
) {
  if (!userId) return [];

  return getActiveMembershipRecipients(context, {
    userId,
  });
}

export async function getExecutionRecipients(
  context: NotificationRoutingContext,
  {
    assignedUserId,
    assignedDepartmentId,
  }: {
    assignedUserId?: string | null;
    assignedDepartmentId?: string | null;
  },
) {
  const directRecipients = await getDirectUserRecipient(
    context,
    assignedUserId,
  );
  if (directRecipients.length > 0) {
    return directRecipients;
  }

  return getDepartmentRecipients(context, assignedDepartmentId);
}

export function mergeRecipients(
  ...groups: Array<NotificationRecipient[] | undefined | null>
) {
  const unique = new Map<string, NotificationRecipient>();

  for (const group of groups) {
    for (const recipient of group ?? []) {
      if (!recipient.userId) continue;
      unique.set(recipient.userId, recipient);
    }
  }

  return Array.from(unique.values());
}

export function excludeActor(
  recipients: NotificationRecipient[],
  actorUserId: string | null | undefined,
) {
  if (!actorUserId) return recipients;
  return recipients.filter((recipient) => recipient.userId !== actorUserId);
}
