import * as z from "zod";
import { MembershipStatus } from "@prisma/client";
import { EDITABLE_MEMBERSHIP_ROLES } from "@/features/auth/utils/roles";

export const editableMemberRoleValues = EDITABLE_MEMBERSHIP_ROLES;

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
  designation: z
    .string()
    .trim()
    .max(120, { message: "Designation is too long." })
    .optional()
    .transform((value) => value || null),
  email: z.email({ message: "Enter a valid email address." }),
  roles: z
    .array(z.enum(editableMemberRoleValues), {
      message: "Select at least one valid role.",
    })
    .min(1, { message: "Select at least one role." }),
  status: z.enum(membershipStatusValues, {
    message: "Select a valid membership status.",
  }),
  departmentId: z
    .string()
    .trim()
    .cuid({ message: "Select a valid department." }),
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
