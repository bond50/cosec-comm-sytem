"use server";

import { MembershipStatus, Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { db } from "@/lib/db";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  editableMemberRoleValues,
  updateMemberAccessSchema,
  type UpdateMemberAccessActionState,
} from "@/features/application/lib/update-member-access.shared";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";

export async function updateMemberAccessAction(
  _previousState: UpdateMemberAccessActionState,
  formData: FormData,
): Promise<UpdateMemberAccessActionState> {
  const values = {
    userId: String(formData.get("userId") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    role: String(formData.get("role") ?? ""),
    status: String(formData.get("status") ?? ""),
    departmentId: String(formData.get("departmentId") ?? "").trim(),
  };

  const parsed = updateMemberAccessSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: {
        userId: values.userId,
        name: values.name,
        email: values.email,
        role:
          editableMemberRoleValues.find((role) => role === values.role) ??
          UserRole.USER,
        status:
          values.status === MembershipStatus.SUSPENDED ||
          values.status === MembershipStatus.INACTIVE
            ? values.status
            : MembershipStatus.ACTIVE,
        departmentId: values.departmentId || undefined,
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
        message: "You must be signed in to manage members.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message: "An active organization is required before managing members.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message: "Your role cannot manage organization members.",
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message:
        "We could not verify your organization access right now. Please try again.",
      values: parsed.data,
    };
  }

  const [membership, department, duplicateEmailUser] = await Promise.all([
    db.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: parsed.data.userId,
        },
      },
      select: {
        organizationId: true,
        userId: true,
        departmentId: true,
      },
    }),
    parsed.data.departmentId
      ? db.department.findFirst({
          where: {
            id: parsed.data.departmentId,
            organizationId,
          },
          select: {
            id: true,
          },
        })
      : Promise.resolve(null),
    db.user.findUnique({
      where: {
        email: parsed.data.email,
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (!membership) {
    return {
      ok: false,
      message: "The selected organization member could not be found.",
      fieldErrors: {
        userId: ["The selected organization member could not be found."],
      },
      values: parsed.data,
    };
  }

  if (parsed.data.departmentId && !department) {
    return {
      ok: false,
      message: "The selected department could not be found.",
      fieldErrors: {
        departmentId: ["The selected department could not be found."],
      },
      values: parsed.data,
    };
  }

  if (duplicateEmailUser && duplicateEmailUser.id !== parsed.data.userId) {
    return {
      ok: false,
      message: "That email already belongs to another account.",
      fieldErrors: {
        email: ["That email already belongs to another account."],
      },
      values: parsed.data,
    };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: parsed.data.userId,
        },
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
        },
      });

      await tx.organizationMembership.update({
        where: {
          organizationId_userId: {
            organizationId,
            userId: parsed.data.userId,
          },
        },
        data: {
          role: parsed.data.role,
          status: parsed.data.status,
          departmentId:
            parsed.data.status === MembershipStatus.ACTIVE
              ? (parsed.data.departmentId ?? null)
              : null,
        },
      });

      if (
        parsed.data.status !== MembershipStatus.ACTIVE ||
        membership.departmentId !== (parsed.data.departmentId ?? null)
      ) {
        await tx.department.updateMany({
          where: {
            organizationId,
            headUserId: parsed.data.userId,
            ...(parsed.data.departmentId
              ? {
                  NOT: {
                    id: parsed.data.departmentId,
                  },
                }
              : {}),
          },
          data: {
            headUserId: null,
          },
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/access");
    revalidatePath("/dashboard/members");
    revalidatePath("/dashboard/members/add");
    revalidatePath("/dashboard/departments");

    return {
      ok: true,
      message: "Member record updated successfully.",
      values: parsed.data,
      data: {
        userId: parsed.data.userId,
        organizationId,
      },
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        message: "That email already belongs to another account.",
        fieldErrors: {
          email: ["That email already belongs to another account."],
        },
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message: "We could not update the member right now. Please try again.",
      values: parsed.data,
    };
  }
}
