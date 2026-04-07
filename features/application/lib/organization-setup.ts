"use server";

import { MembershipStatus, Prisma, UserRole } from "@prisma/client";
import * as z from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getOrganizationBySlug } from "@/features/application/queries/organizations";
import {
  coerceOrganizationType,
  organizationSetupSchema,
  type CreateOrganizationActionState,
} from "@/features/application/lib/organization-setup.shared";
import { getCurrentOrganization } from "@/features/auth/utils/current-organization";
import { getCurrentUser } from "@/features/auth/utils/current-user";

export async function createOrganizationAction(
  _previousState: CreateOrganizationActionState,
  formData: FormData,
): Promise<CreateOrganizationActionState> {
  const values = {
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "")
      .trim()
      .toLowerCase(),
    type: String(formData.get("type") ?? ""),
  };

  const parsed = organizationSetupSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: {
        name: values.name,
        slug: values.slug,
        type: coerceOrganizationType(values.type),
      },
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      message: "You must be signed in to create an organization.",
      values: parsed.data,
    };
  }

  const activeOrganization = await getCurrentOrganization();
  if (activeOrganization) {
    return {
      ok: false,
      message: "Your account already has an active organization.",
      values: parsed.data,
    };
  }

  const existingOrganization = await getOrganizationBySlug(parsed.data.slug);
  if (existingOrganization) {
    return {
      ok: false,
      message: "That organization slug is already in use.",
      fieldErrors: {
        slug: ["That organization slug is already in use."],
      },
      values: parsed.data,
    };
  }

  try {
    const created = await db.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: parsed.data.name,
          slug: parsed.data.slug,
          type: parsed.data.type,
        },
        select: {
          id: true,
          slug: true,
        },
      });

      await tx.organizationMembership.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: UserRole.ORG_ADMIN,
          status: MembershipStatus.ACTIVE,
        },
      });

      return organization;
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/organization/setup");

    return {
      ok: true,
      message: "Organization created successfully.",
      values: parsed.data,
      data: {
        organizationId: created.id,
        organizationSlug: created.slug,
      },
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        message: "That organization slug is already in use.",
        fieldErrors: {
          slug: ["That organization slug is already in use."],
        },
        values: parsed.data,
      };
    }

    return {
      ok: false,
      message:
        "We could not create the organization right now. Please try again.",
      values: parsed.data,
    };
  }
}
