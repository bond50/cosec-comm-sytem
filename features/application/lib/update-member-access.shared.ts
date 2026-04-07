import * as z from "zod";
import { MembershipStatus, UserRole } from "@prisma/client";

export const editableMemberRoleValues = [
  UserRole.ORG_ADMIN,
  UserRole.REGISTRY_OFFICER,
  UserRole.REVIEWING_OFFICER,
  UserRole.DEPARTMENT_USER,
  UserRole.MANAGEMENT,
  UserRole.USER,
] as const;

const membershipStatusValues = [
  MembershipStatus.ACTIVE,
  MembershipStatus.SUSPENDED,
  MembershipStatus.INACTIVE,
] as const;

export const updateMemberAccessSchema = z.object({
  userId: z.string().trim().cuid({ message: "Invalid member identifier." }),
  name: z
    .string()
    .trim()
    .min(2, { message: "Name is required." })
    .max(120, { message: "Name is too long." }),
  email: z.email({ message: "Enter a valid email address." }),
  role: z.enum(editableMemberRoleValues, {
    message: "Select a valid role.",
  }),
  status: z.enum(membershipStatusValues, {
    message: "Select a valid membership status.",
  }),
  departmentId: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => !value || /^c[a-z0-9]{24,}$/i.test(value), {
      message: "Select a valid department.",
    }),
});

export type UpdateMemberAccessValues = z.infer<typeof updateMemberAccessSchema>;

export type UpdateMemberAccessActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Partial<UpdateMemberAccessValues>;
  data?: {
    userId: string;
    organizationId: string;
  };
};

export const initialUpdateMemberAccessState: UpdateMemberAccessActionState = {
  ok: false,
  message: "",
  fieldErrors: {},
};
