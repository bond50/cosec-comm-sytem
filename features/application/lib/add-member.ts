"use server";

import { MembershipStatus, Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { db } from "@/lib/db";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";

type AddMemberActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
  data?: {
    membershipId: string;
    organizationId: string;
    userId: string;
  };
};

const memberRoleValues = [
  UserRole.ORG_ADMIN,
  UserRole.REGISTRY_OFFICER,
  UserRole.REVIEWING_OFFICER,
  UserRole.DEPARTMENT_USER,
  UserRole.MANAGEMENT,
  UserRole.USER,
] as const;

const addMemberSchema = z.object({
  userId: z.string().trim().cuid({ message: "Select a valid user." }),
  role: z.enum(memberRoleValues, {
    message: "Select a valid role.",
  }),
});

export async function addMemberAction(
  _previousState: AddMemberActionState,
  formData: FormData,
): Promise<AddMemberActionState> {
  const values = {
    userId: String(formData.get("userId") ?? "").trim(),
    role: String(formData.get("role") ?? ""),
  };

  const parsed = addMemberSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  let organizationId: string;

  try {
    const access = await requireOrganizationPermission("members.manage");
    organizationId = access.organization.id;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to add a member.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message: "An active organization is required before adding members.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message: "Your role cannot add members to this organization.",
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message:
        "We could not verify your organization right now. Please try again.",
      values: parsed.data,
    };
  }

  const [user, existingMembership] = await Promise.all([
    db.user.findUnique({
      where: {
        id: parsed.data.userId,
      },
      select: {
        id: true,
      },
    }),
    db.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: parsed.data.userId,
        },
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (!user) {
    return {
      ok: false,
      message: "The selected user could not be found.",
      fieldErrors: {
        userId: ["The selected user could not be found."],
      },
      values: parsed.data,
    };
  }

  if (existingMembership) {
    return {
      ok: false,
      message: "This user is already a member of the current organization.",
      fieldErrors: {
        userId: ["This user is already a member of the current organization."],
      },
      values: parsed.data,
    };
  }

  try {
    const membership = await db.organizationMembership.create({
      data: {
        userId: user.id,
        organizationId,
        role: parsed.data.role,
        status: MembershipStatus.ACTIVE,
      },
      select: {
        id: true,
        organizationId: true,
        userId: true,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/access");
    revalidatePath("/dashboard/members");
    revalidatePath("/dashboard/members/add");

    return {
      ok: true,
      message: "Member added successfully.",
      values: {
        userId: "",
        role: UserRole.USER,
      },
      data: {
        membershipId: membership.id,
        organizationId: membership.organizationId,
        userId: membership.userId,
      },
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        message: "This user is already a member of the current organization.",
        fieldErrors: {
          userId: [
            "This user is already a member of the current organization.",
          ],
        },
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message: "We could not add the member right now. Please try again.",
      values: parsed.data,
    };
  }
}
