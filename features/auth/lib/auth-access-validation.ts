import * as z from "zod";
import { type AuthAccessActionState } from "@/features/auth/actions/access";
import { loginSchema, registerSchema } from "@/features/auth/schemas/auth";

export type AuthAccessLocalFieldErrors = Partial<
  Record<
    "email" | "password" | "confirmPassword" | "code" | "turnstile",
    string
  >
>;

export const authInputErrorClass =
  "border-rose-300 focus:border-rose-500 focus:shadow-[0_0_0_4px_rgba(244,63,94,0.12)]";

export function clearAuthAccessErrors(
  current: AuthAccessLocalFieldErrors,
  keys: Array<keyof AuthAccessLocalFieldErrors>,
): AuthAccessLocalFieldErrors {
  const next = { ...current };

  for (const key of keys) {
    next[key] = undefined;
  }

  return next;
}

export function getAuthAccessIntent(
  mode: AuthAccessActionState["mode"],
): string {
  if (mode === "email") return "resolve";
  if (mode === "login") return "login";
  if (mode === "register") return "register";
  return "change-email";
}

export function getAuthAccessFieldErrors(
  localErrors: AuthAccessLocalFieldErrors,
  stateFieldErrors: AuthAccessActionState["fieldErrors"],
) {
  return {
    email: localErrors.email ?? stateFieldErrors?.email,
    password: localErrors.password ?? stateFieldErrors?.password,
    confirmPassword:
      localErrors.confirmPassword ?? stateFieldErrors?.confirmPassword,
    code: localErrors.code ?? stateFieldErrors?.code,
    turnstile: localErrors.turnstile ?? stateFieldErrors?.turnstile,
  };
}

export function validateAuthAccessSubmit({
  formData,
  mode,
  emailValue,
  registrationComplete,
  turnstileToken,
}: {
  formData: FormData;
  mode: AuthAccessActionState["mode"];
  emailValue: string;
  registrationComplete: boolean;
  turnstileToken: string;
}): AuthAccessLocalFieldErrors | null {
  if (mode === "email") {
    const email = String(formData.get("email") ?? "").trim();
    const parsed = loginSchema.pick({ email: true }).safeParse({ email });

    if (!parsed.success) {
      const fields = z.flattenError(parsed.error).fieldErrors;
      return {
        email: fields.email?.[0] ?? "Enter a valid email address.",
      };
    }

    if (!turnstileToken.trim()) {
      return {
        turnstile: "Complete the security check before continuing.",
      };
    }
  }

  if (mode === "login") {
    const parsed = loginSchema.safeParse({
      email: emailValue,
      password: String(formData.get("password") ?? ""),
      code: String(formData.get("code") ?? ""),
    });

    if (!parsed.success) {
      const fields = z.flattenError(parsed.error).fieldErrors;
      return {
        email: fields.email?.[0],
        password: fields.password?.[0],
        code: fields.code?.[0],
      };
    }
  }

  if (mode === "register" && !registrationComplete) {
    const parsed = registerSchema.safeParse({
      email: emailValue,
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });

    if (!parsed.success) {
      const fields = z.flattenError(parsed.error).fieldErrors;
      return {
        email: fields.email?.[0],
        password: fields.password?.[0],
        confirmPassword: fields.confirmPassword?.[0],
      };
    }
  }

  return null;
}
