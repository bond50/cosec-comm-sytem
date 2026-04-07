"use server";

import { DepartmentStatus, Prisma } from "@prisma/client";
import * as z from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  createDepartmentSchema,
  type CreateDepartmentActionState,
} from "@/features/application/lib/create-department.shared";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";

export async function createDepartmentAction(
  _previousState: CreateDepartmentActionState,
  formData: FormData,
): Promise<CreateDepartmentActionState> {
  const values = {
    name: String(formData.get("name") ?? "").trim(),
    code: String(formData.get("code") ?? "")
      .trim()
      .toUpperCase(),
    description: String(formData.get("description") ?? "").trim(),
  };

  const parsed = createDepartmentSchema.safeParse(values);
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
        message: "You must be signed in to create a department.",
        values: parsed.data,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message:
          "An active organization is required before creating departments.",
        values: parsed.data,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message: "Your role cannot create departments in this organization.",
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

  try {
    const department = await db.department.create({
      data: {
        organizationId,
        name: parsed.data.name.trim(),
        code: parsed.data.code,
        description: parsed.data.description,
        status: DepartmentStatus.ACTIVE,
      },
      select: {
        id: true,
        organizationId: true,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/access");
    revalidatePath("/dashboard/departments");

    return {
      ok: true,
      message: "Department created successfully.",
      values: {
        name: "",
        code: "",
        description: "",
      },
      data: {
        departmentId: department.id,
        organizationId: department.organizationId,
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
        "We could not create the department right now. Please try again.",
      values: parsed.data,
    };
  }
}
