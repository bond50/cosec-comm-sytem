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
import { areMembershipRolesAllowedForDepartmentKind } from "@/features/application/lib/membership-role-policy";
import {
  normalizeMembershipRoles,
  resolvePrimaryRole,
} from "@/features/auth/utils/roles";

export async function provisionMemberAction(
  _previousState: ProvisionMemberActionState,
  formData: FormData,
): Promise<ProvisionMemberActionState> {
  const submittedRoles = normalizeMembershipRoles(
    formData
      .getAll("roles")
      .map((value) => String(value))
      .filter(Boolean) as UserRole[],
  ).filter((role): role is (typeof memberProvisionRoleValues)[number] =>
    memberProvisionRoleValues.includes(
      role as (typeof memberProvisionRoleValues)[number],
    ),
  );

  const values = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    roles: submittedRoles,
    departmentId: String(formData.get("departmentId") ?? "").trim(),
  };

  const parsed = provisionMemberSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: {
        ...values,
        roles: values.roles.length > 0 ? values.roles : [UserRole.USER],
      },
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

  const department = await db.department.findFirst({
    where: {
      id: parsed.data.departmentId,
      organizationId,
    },
    select: {
      id: true,
      kind: true,
    },
  });

  if (!department) {
    return {
      ok: false,
      message: "The selected department could not be found.",
      fieldErrors: {
        departmentId: ["The selected department could not be found."],
      },
      values: {
        ...parsed.data,
        password: "",
        confirmPassword: "",
      },
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
          mustChangePassword: true,
        },
        select: {
          id: true,
        },
      });

      return tx.organizationMembership.create({
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
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/access");
    revalidatePath("/dashboard/members");

    return {
      ok: true,
      message: "Member account created and added to the organization.",
      values: {
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        roles: [],
        departmentId: parsed.data.departmentId,
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

    console.error("provisionMemberAction failed", error);

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
