import * as z from "zod";

export const createDepartmentSchema = z.object({
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
});

export type CreateDepartmentValues = {
  name: string;
  code?: string;
  description?: string;
};

export type CreateDepartmentActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Partial<CreateDepartmentValues>;
  data?: {
    departmentId: string;
    organizationId: string;
  };
};

export const initialCreateDepartmentState: CreateDepartmentActionState = {
  ok: false,
  message: "",
  fieldErrors: {},
  values: {
    name: "",
    code: "",
    description: "",
  },
};
