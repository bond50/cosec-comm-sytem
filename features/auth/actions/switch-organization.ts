"use server";

import * as z from "zod";
import { auth, unstable_update } from "@/auth";
import { getActiveOrganizationMembershipByUserId } from "@/features/auth/queries/organization-membership";

const switchOrganizationSchema = z.object({
  organizationId: z.string().min(1, { message: "Organization is required." }),
});

export type SwitchOrganizationActionState = {
  ok: boolean;
  message: string;
};

export async function switchOrganization(
  formData: FormData,
): Promise<SwitchOrganizationActionState> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      ok: false,
      message: "Your session has expired. Sign in again.",
    };
  }

  const parsed = switchOrganizationSchema.safeParse({
    organizationId: String(formData.get("organizationId") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.flatten().fieldErrors.organizationId?.[0] ??
        "Choose an organization.",
    };
  }

  const membership = await getActiveOrganizationMembershipByUserId(
    userId,
    parsed.data.organizationId,
  );

  if (!membership?.organization) {
    return {
      ok: false,
      message: "You do not have active access to that organization.",
    };
  }

  await unstable_update({
    organization: {
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      role: membership.role,
      roles: membership.roles,
    },
  });

  return {
    ok: true,
    message: `Switched to ${membership.organization.name}.`,
  };
}

export async function switchOrganizationAction(
  formData: FormData,
): Promise<void> {
  await switchOrganization(formData);
}
