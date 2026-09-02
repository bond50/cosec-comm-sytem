import * as z from "zod";
import { EDITABLE_MEMBERSHIP_ROLES } from "@/features/auth/utils/roles";

export const memberProvisionRoleValues = EDITABLE_MEMBERSHIP_ROLES;

export const provisionMemberSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: "Name is required." })
      .max(120, { message: "Name is too long." }),
    designation: z
      .string()
      .trim()
      .max(120, { message: "Designation is too long." })
      .optional()
      .transform((value) => value || null),
    email: z.email({ message: "Enter a valid email address." }),
    // Deliberately relaxed: this is a temporary password an administrator
    // hands to someone else. The account is forced to set a real password
    // (under the normal strong-password rules) on first login, so requiring
    // complexity here just makes handoff harder without adding security.
    password: z
      .string()
      .min(4, { message: "Password must be at least 4 characters long." }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm the password." }),
    roles: z
      .array(z.enum(memberProvisionRoleValues), {
        message: "Select at least one valid role.",
      })
      .min(1, { message: "Select at least one role." }),
    departmentId: z
      .string()
      .trim()
      .cuid({ message: "Select a valid department." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ProvisionMemberValues = z.infer<typeof provisionMemberSchema>;

export type ProvisionMemberActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Partial<ProvisionMemberValues>;
  data?: {
    membershipId: string;
    organizationId: string;
    userId: string;
  };
};

export const initialProvisionMemberState: ProvisionMemberActionState = {
  ok: false,
  message: "",
  fieldErrors: {},
  values: {
    name: "",
    designation: "",
    email: "",
    password: "",
    confirmPassword: "",
    roles: [],
    departmentId: "",
  },
};
