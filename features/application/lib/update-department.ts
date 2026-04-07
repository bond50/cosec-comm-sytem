"use server";

import { DepartmentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { db } from "@/lib/db";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  updateDepartmentSchema,
  type UpdateDepartmentActionState,
} from "@/features/application/lib/update-department.shared";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";

export async function updateDepartmentAction(
  _previousState: UpdateDepartmentActionState,
  formData: FormData,
): Promise<UpdateDepartmentActionState> {
  const values = {
    departmentId: String(formData.get("departmentId") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    code: String(formData.get("code") ?? "")
      .trim()
      .toUpperCase(),
    description: String(formData.get("description") ?? "").trim(),
    status: String(formData.get("status") ?? ""),
  };

  const parsed = updateDepartmentSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: {
        departmentId: values.departmentId,
        name: values.name,
        code: values.code || undefined,
        description: values.description || undefined,
        status:
          values.status === DepartmentStatus.INACTIVE
            ? DepartmentStatus.INACTIVE
            : DepartmentStatus.ACTIVE,
      },
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
        message: "You must be signed in to manage departments.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before managing departments.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message: "Your role cannot manage departments.",
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

  const department = await db.department.findFirst({
    where: {
      id: parsed.data.departmentId,
      organizationId,
    },
    select: {
      id: true,
    },
  });

  if (!department) {
    return {
      ok: false,
      message: "The selected department could not be found.",
      fieldErrors: {
        departmentId: ["The selected department could not be found."],
      },
      values: parsed.data,
    };
  }

  try {
    const updated = await db.department.update({
      where: {
        id: department.id,
      },
      data: {
        name: parsed.data.name,
        code: parsed.data.code,
        description: parsed.data.description,
        status: parsed.data.status,
      },
      select: {
        id: true,
        organizationId: true,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/access");
    revalidatePath("/dashboard/departments");
    revalidatePath(`/dashboard/departments/${updated.id}`);
    revalidatePath(`/dashboard/departments/${updated.id}/members`);
    revalidatePath(`/dashboard/departments/${updated.id}/head`);

    return {
      ok: true,
      message: "Department updated successfully.",
      values: parsed.data,
      data: {
        departmentId: updated.id,
        organizationId: updated.organizationId,
      },
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = Array.isArray(error.meta?.target) ? error.meta.target : [];

      if (target.includes("name")) {
        return {
          ok: false,
          message:
            "A department with that name already exists in this organization.",
          fieldErrors: {
            name: [
              "A department with that name already exists in this organization.",
            ],
          },
          values: parsed.data,
        };
      }

      if (target.includes("code")) {
        return {
          ok: false,
          message:
            "That department code is already in use in this organization.",
          fieldErrors: {
            code: [
              "That department code is already in use in this organization.",
            ],
          },
          values: parsed.data,
        };
      }
    }

    return {
      ok: false,
      message:
        "We could not update the department right now. Please try again.",
      values: parsed.data,
    };
  }
}
