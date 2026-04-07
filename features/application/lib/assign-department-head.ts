"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { MembershipStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";

type AssignDepartmentHeadActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
  data?: {
    departmentId: string;
    userId: string;
  };
};

const assignDepartmentHeadSchema = z.object({
  departmentId: z
    .string()
    .trim()
    .cuid({ message: "Select a valid department." }),
  userId: z
    .string()
    .trim()
    .cuid({ message: "Select a valid organization member." }),
});

export async function assignDepartmentHeadAction(
  _previousState: AssignDepartmentHeadActionState,
  formData: FormData,
): Promise<AssignDepartmentHeadActionState> {
  const values = {
    departmentId: String(formData.get("departmentId") ?? "").trim(),
    userId: String(formData.get("userId") ?? "").trim(),
  };

  const parsed = assignDepartmentHeadSchema.safeParse(values);
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
        message: "You must be signed in to assign a department head.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before assigning department heads.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message: "Your role cannot assign department heads.",
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

  if (membership.departmentId !== department.id) {
    return {
      ok: false,
      message:
        "The selected user must first be assigned to this department before becoming head.",
      fieldErrors: {
        userId: [
          "Assign this member to the department before making them the department head.",
        ],
      },
      values: parsed.data,
    };
  }

  const existingDepartment = await db.department.findFirst({
    where: {
      id: parsed.data.departmentId,
      organizationId,
    },
    select: {
      headUserId: true,
    },
  });

  if (existingDepartment?.headUserId === parsed.data.userId) {
    return {
      ok: false,
      message: "This user is already the department head.",
      values: parsed.data,
    };
  }
  await db.department.update({
    where: {
      id: department.id,
    },
    data: {
      headUserId: membership.userId,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/access");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/departments");
  revalidatePath(`/dashboard/departments/${department.id}`);
  revalidatePath(`/dashboard/departments/${department.id}/head`);

  return {
    ok: true,
    message: "Department head assigned successfully.",
    values: parsed.data,
    data: {
      departmentId: department.id,
      userId: membership.userId,
    },
  };
}
