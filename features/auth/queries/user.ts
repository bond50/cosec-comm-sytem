// features/auth/queries/user.ts
import { db } from "@/lib/db";
import { ADMIN_MEMBERSHIP_ROLES } from "@/features/auth/utils/roles";

export const getUserByEmail = async (email: string) => {
  return db.user.findUnique({
    where: {
      email,
    },
  });
};

export const getUserById = async (id: string | undefined) => {
  return db.user.findUnique({
    where: {
      id,
    },
  });
};

export const getUsersForSelect = async (): Promise<
  { id: string; name: string; email: string }[]
> => {
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name || "Unnamed",
    email: user.email ?? "",
  }));
};

export const getAdminNotificationRecipients = async (): Promise<string[]> => {
  const admins = await db.organizationMembership.findMany({
    where: {
      role: {
        in: [...ADMIN_MEMBERSHIP_ROLES],
      },
      user: {
        email: {
          not: null,
        },
      },
    },
    select: {
      user: {
        select: {
          email: true,
        },
      },
    },
    distinct: ["userId"],
    orderBy: {
      user: {
        email: "asc",
      },
    },
  });

  return admins
    .map((admin) => admin.user.email?.trim().toLowerCase())
    .filter((email): email is string => Boolean(email));
};
