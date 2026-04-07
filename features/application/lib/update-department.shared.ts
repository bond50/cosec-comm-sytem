import * as z from "zod";
import { DepartmentStatus } from "@prisma/client";

export const updateDepartmentSchema = z.object({
  departmentId: z
    .string()
    .trim()
    .cuid({ message: "Invalid department identifier." }),
  name: z
    .string()
    .trim()
    .min(2, { message: "Department name is required." })
    .max(120, { message: "Department name is too long." }),
  code: z
    .string()
    .trim()
    .max(24, { message: "Department code is too long." })
    .optional()
    .transform((value) => value || undefined),
  description: z
    .string()
    .trim()
    .max(500, { message: "Description is too long." })
    .optional()
    .transform((value) => value || undefined),
  status: z.enum([DepartmentStatus.ACTIVE, DepartmentStatus.INACTIVE], {
    message: "Select a valid department status.",
  }),
});

export type UpdateDepartmentValues = z.infer<typeof updateDepartmentSchema>;

export type UpdateDepartmentActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Partial<UpdateDepartmentValues>;
  data?: {
    departmentId: string;
    organizationId: string;
  };
};

export const initialUpdateDepartmentState: UpdateDepartmentActionState = {
  ok: false,
  message: "",
  fieldErrors: {},
};
