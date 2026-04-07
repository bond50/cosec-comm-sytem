import * as z from "zod";

import { registerSchema } from "@/features/auth/schemas/auth";

export type RegisterFormLocalFieldErrors = Partial<
  Record<"email" | "password" | "confirmPassword", string>
>;

export const registerInputErrorClass =
  "border-rose-300 focus:border-rose-500 focus:shadow-[0_0_0_4px_rgba(244,63,94,0.12)]";

export function validateRegisterFormSubmit(
  formData: FormData,
): RegisterFormLocalFieldErrors | null {
  const parsed = registerSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (parsed.success) {
    return null;
  }

  const fields = z.flattenError(parsed.error).fieldErrors;
  return {
    email: fields.email?.[0],
    password: fields.password?.[0],
    confirmPassword: fields.confirmPassword?.[0],
  };
}
