import { OrganizationType } from "@prisma/client";
import * as z from "zod";

const organizationTypeValues = Object.values(OrganizationType) as [
  OrganizationType,
  ...OrganizationType[],
];

export const organizationSetupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Organization name is required." })
    .max(120, { message: "Organization name is too long." }),
  slug: z
    .string()
    .trim()
    .min(2, { message: "Slug is required." })
    .max(64, { message: "Slug is too long." })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Use lowercase letters, numbers, and single hyphens only.",
    }),
  type: z.enum(organizationTypeValues, {
    message: "Select a valid organization type.",
  }),
});

export type OrganizationSetupValues = {
  name: string;
  slug: string;
  type: OrganizationType;
};

export type CreateOrganizationActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Partial<OrganizationSetupValues>;
  data?: {
    organizationId: string;
    organizationSlug: string;
  };
};

export const initialCreateOrganizationState: CreateOrganizationActionState = {
  ok: false,
  message: "",
  fieldErrors: {},
  values: {
    name: "",
    slug: "",
    type: OrganizationType.COUNTY,
  },
};

export function coerceOrganizationType(value: string): OrganizationType {
  return (
    organizationTypeValues.find((type) => type === value) ??
    OrganizationType.COUNTY
  );
}
