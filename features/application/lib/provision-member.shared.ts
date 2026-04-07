import * as z from "zod";
import { UserRole } from "@prisma/client";

export const memberProvisionRoleValues = [
  UserRole.ORG_ADMIN,
  UserRole.REGISTRY_OFFICER,
  UserRole.REVIEWING_OFFICER,
  UserRole.DEPARTMENT_USER,
  UserRole.MANAGEMENT,
  UserRole.USER,
] as const;

export const provisionMemberSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: "Name is required." })
      .max(120, { message: "Name is too long." }),
    email: z.email({ message: "Enter a valid email address." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long." })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter.",
      })
      .regex(/[0-9]/, {
        message: "Password must contain at least one number.",
      })
      .regex(/[^A-Za-z0-9]/, {
        message: "Password must contain at least one special character.",
      }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm the password." }),
    role: z.enum(memberProvisionRoleValues, {
      message: "Select a valid role.",
    }),
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
    email: "",
    password: "",
    confirmPassword: "",
    role: UserRole.USER,
  },
};
