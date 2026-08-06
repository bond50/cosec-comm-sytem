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
import {
  EDITABLE_MEMBERSHIP_ROLES,
  normalizeMembershipRoles,
  resolvePrimaryRole,
} from "@/features/auth/utils/roles";
import { areMembershipRolesAllowedForDepartmentKind } from "@/features/application/lib/membership-role-policy";

type AddMemberActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
  roleValues?: UserRole[];
  data?: {
    membershipId: string;
    organizationId: string;
    userId: string;
  };
};

const memberRoleValues = EDITABLE_MEMBERSHIP_ROLES;

const addMemberSchema = z.object({
  userId: z.string().trim().cuid({ message: "Select a valid user." }),
  departmentId: z
    .string()
    .trim()
    .cuid({ message: "Select a valid department." }),
  roles: z
    .array(z.enum(memberRoleValues), {
      message: "Select at least one valid role.",
    })
    .min(1, { message: "Select at least one role." }),
});

export async function addMemberAction(
  _previousState: AddMemberActionState,
  formData: FormData,
): Promise<AddMemberActionState> {
  const values = {
    userId: String(formData.get("userId") ?? "").trim(),
    departmentId: String(formData.get("departmentId") ?? "").trim(),
    roles: normalizeMembershipRoles(
      formData
        .getAll("roles")
        .map((value) => String(value))
        .filter(Boolean) as UserRole[],
    ),
  };

  const parsed = addMemberSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: {
        userId: values.userId,
        departmentId: values.departmentId,
      },
      roleValues: values.roles,
    };
  }

  const primaryRole = resolvePrimaryRole(parsed.data.roles) ?? UserRole.USER;

  let organizationId: string;

  try {
    const access = await requireOrganizationPermission("members.manage");
    organizationId = access.organization.id;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return {
        ok: false,
        message: "You must be signed in to add a member.",
        values: {
          userId: parsed.data.userId,
          departmentId: parsed.data.departmentId,
        },
        roleValues: parsed.data.roles,
      };
    }

    if (error instanceof MissingOrganizationError) {
      return {
        ok: false,
        message: "An active organization is required before adding members.",
        values: {
          userId: parsed.data.userId,
          departmentId: parsed.data.departmentId,
        },
        roleValues: parsed.data.roles,
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        ok: false,
        message: "Your role cannot add members to this organization.",
        values: {
          userId: parsed.data.userId,
          departmentId: parsed.data.departmentId,
        },
        roleValues: parsed.data.roles,
      };
    }

    return {
      ok: false,
      message:
        "We could not verify your organization right now. Please try again.",
      values: {
        userId: parsed.data.userId,
        departmentId: parsed.data.departmentId,
      },
      roleValues: parsed.data.roles,
    };
  }

  const [user, existingMembership, department] = await Promise.all([
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
    db.department.findFirst({
      where: {
        id: parsed.data.departmentId,
        organizationId,
      },
      select: {
        id: true,
        kind: true,
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
      values: {
        userId: parsed.data.userId,
        departmentId: parsed.data.departmentId,
      },
      roleValues: parsed.data.roles,
    };
  }

  if (!department) {
    return {
      ok: false,
      message: "The selected department could not be found.",
      fieldErrors: {
        departmentId: ["The selected department could not be found."],
      },
      values: {
        userId: parsed.data.userId,
        departmentId: parsed.data.departmentId,
      },
      roleValues: parsed.data.roles,
    };
  }

  if (
    !areMembershipRolesAllowedForDepartmentKind(
      parsed.data.roles,
      department.kind,
    )
  ) {
    return {
      ok: false,
      message: "The selected roles are not valid for that department.",
      fieldErrors: {
        roles: ["The selected roles are not valid for that department."],
      },
      values: {
        userId: parsed.data.userId,
        departmentId: parsed.data.departmentId,
      },
      roleValues: parsed.data.roles,
    };
  }

  if (existingMembership) {
    return {
      ok: false,
      message: "This user is already a member of the current organization.",
      fieldErrors: {
        userId: ["This user is already a member of the current organization."],
      },
      values: {
        userId: parsed.data.userId,
        departmentId: parsed.data.departmentId,
      },
      roleValues: parsed.data.roles,
    };
  }

  try {
    const membership = await db.organizationMembership.create({
      data: {
        userId: user.id,
        organizationId,
        departmentId: department.id,
        role: primaryRole,
        roles: parsed.data.roles,
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

    return {
      ok: true,
      message: "Member added successfully.",
      values: {
        userId: "",
        departmentId: "",
      },
      roleValues: [],
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
        values: {
          userId: parsed.data.userId,
          departmentId: parsed.data.departmentId,
        },
        roleValues: parsed.data.roles,
      };
    }

    return {
      ok: false,
      message: "We could not add the member right now. Please try again.",
      values: {
        userId: parsed.data.userId,
        departmentId: parsed.data.departmentId,
      },
      roleValues: parsed.data.roles,
    };
  }
}
