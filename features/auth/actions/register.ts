"use server";

import * as z from "zod";
import { registerSchema } from "@/features/auth/schemas/auth";
import { registerUser } from "@/features/auth/lib/register-user";

export type RegisterActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<
    Record<"name" | "email" | "password" | "confirmPassword", string>
  >;
  values?: {
    name?: string;
    email?: string;
  };
};

function getRegisterFieldErrors(
  error: z.ZodError<z.infer<typeof registerSchema>>,
  values?: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  },
) {
  const fields = z.flattenError(error).fieldErrors;

  return {
    name:
      fields.name?.[0] ?? (!values?.name ? "Full name is required" : undefined),
    email:
      fields.email?.[0] ?? (!values?.email ? "Email is required" : undefined),
    password:
      fields.password?.[0] ??
      (!values?.password ? "Password is required" : undefined),
    confirmPassword:
      fields.confirmPassword?.[0] ??
      (!values?.confirmPassword ? "Please confirm your password" : undefined),
  } satisfies RegisterActionState["fieldErrors"];
}

export async function registerAction(
  _previousState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };

  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: getRegisterFieldErrors(parsed.error, values),
      values: {
        name: values.name,
        email: values.email,
      },
    };
  }

  const result = await registerUser(parsed.data);

  return {
    error: result?.error,
    success: result?.success,
    values: {
      name: parsed.data.name,
      email: parsed.data.email,
    },
  };
}
