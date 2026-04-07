"use server";

import * as z from "zod";
import { MembershipStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";

type AssignMemberToDepartmentActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
  data?: {
    userId: string;
    departmentId: string;
  };
};

const assignMemberToDepartmentSchema = z.object({
  userId: z
    .string()
    .trim()
    .cuid({ message: "Select a valid organization member." }),
  departmentId: z
    .string()
    .trim()
    .cuid({ message: "Select a valid department." }),
});

export async function assignMemberToDepartmentAction(
  _previousState: AssignMemberToDepartmentActionState,
  formData: FormData,
): Promise<AssignMemberToDepartmentActionState> {
  const values = {
    userId: String(formData.get("userId") ?? "").trim(),
    departmentId: String(formData.get("departmentId") ?? "").trim(),
  };

  const parsed = assignMemberToDepartmentSchema.safeParse(values);
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
    const access = await requireOrganizationPermission("departments.manage");
    organizationId = access.organization.id;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to assign a member to a department.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before assigning department members.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message: "Your role cannot assign members to departments.",
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

  const [department, membership] = await Promise.all([
    db.department.findFirst({
      where: {
        id: parsed.data.departmentId,
        organizationId,
      },
      select: {
        id: true,
      },
    }),
    db.organizationMembership.findFirst({
      where: {
        organizationId,
        userId: parsed.data.userId,
        status: MembershipStatus.ACTIVE,
      },
      select: {
        userId: true,
        departmentId: true,
      },
    }),
  ]);

  if (!department) {
    return {
      ok: false,
      message:
        "The selected department could not be found in this organization.",
      fieldErrors: {
        departmentId: [
          "The selected department could not be found in this organization.",
        ],
      },
      values: parsed.data,
    };
  }

  if (!membership) {
    return {
      ok: false,
      message:
        "The selected user is not an active member of this organization.",
      fieldErrors: {
        userId: [
          "The selected user is not an active member of this organization.",
        ],
      },
      values: parsed.data,
    };
  }

  if (membership.departmentId === department.id) {
    return {
      ok: false,
      message: "This member is already assigned to the selected department.",
      values: parsed.data,
    };
  }

  await db.organizationMembership.update({
    where: {
      organizationId_userId: {
        organizationId,
        userId: membership.userId,
      },
    },
    data: {
      departmentId: department.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/access");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/departments");
  revalidatePath(`/dashboard/departments/${department.id}`);
  revalidatePath(`/dashboard/departments/${department.id}/members`);

  return {
    ok: true,
    message: "Member assigned to department successfully.",
    values: parsed.data,
    data: {
      userId: membership.userId,
      departmentId: department.id,
    },
  };
}
