"use server";

import bcrypt from "bcryptjs";
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
import {
  memberProvisionRoleValues,
  type ProvisionMemberActionState,
  provisionMemberSchema,
} from "@/features/application/lib/provision-member.shared";

export async function provisionMemberAction(
  _previousState: ProvisionMemberActionState,
  formData: FormData,
): Promise<ProvisionMemberActionState> {
  const values = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    role: String(formData.get("role") ?? UserRole.USER),
  };

  const parsed = provisionMemberSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: {
        ...values,
        role:
          memberProvisionRoleValues.find((role) => role === values.role) ??
          UserRole.USER,
      },
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
        message: "You must be signed in to create a member.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message: "An active organization is required before creating members.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message: "Your role cannot create members in this organization.",
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

  const existingUser = await db.user.findUnique({
    where: {
      email: parsed.data.email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return {
      ok: false,
      message: "That email already belongs to an existing account.",
      fieldErrors: {
        email: ["That email already belongs to an existing account."],
      },
      values: {
        ...parsed.data,
        password: "",
        confirmPassword: "",
      },
    };
  }

  try {
    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

    const membership = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          password: hashedPassword,
          emailVerified: new Date(),
        },
        select: {
          id: true,
        },
      });

      return tx.organizationMembership.create({
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
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/access");
    revalidatePath("/dashboard/members");
    revalidatePath("/dashboard/members/add");

    return {
      ok: true,
      message: "Member account created and added to the organization.",
      values: {
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
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
        message: "That email already belongs to an existing account.",
        fieldErrors: {
          email: ["That email already belongs to an existing account."],
        },
        values: {
          ...parsed.data,
          password: "",
          confirmPassword: "",
        },
      };
    }

    return {
      ok: false,
      message:
        "We could not create the member account right now. Please try again.",
      values: {
        ...parsed.data,
        password: "",
        confirmPassword: "",
      },
    };
  }
}
