"use server";

import * as z from "zod";

import { getUserByEmail } from "@/features/auth/queries/user";
import { login, type LoginActionState } from "@/features/auth/actions/login";
import { type RegisterActionState } from "@/features/auth/actions/register";
import { registerUser } from "@/features/auth/lib/register-user";
import { loginSchema, registerSchema } from "@/features/auth/schemas/auth";
import {
  clearTurnstileAccess,
  grantTurnstileAccess,
  hasTurnstileAccess,
  verifyTurnstileToken,
} from "@/lib/security/turnstile";

const emailOnlySchema = z.object({
  email: z.email().min(1, { message: "Email is required" }),
});

type AccessMode = "email" | "login" | "register" | "oauth";

export type AuthAccessActionState = {
  mode: AccessMode;
  error?: string;
  success?: string;
  twoFactorRequired?: boolean;
  fieldErrors?: Partial<
    Record<
      "email" | "password" | "confirmPassword" | "code" | "turnstile",
      string
    >
  >;
  values?: {
    email?: string;
    code?: string;
  };
};

const initialFieldErrors: NonNullable<AuthAccessActionState["fieldErrors"]> =
  {};

function getEmailFieldErrors(
  error: z.ZodError<z.infer<typeof emailOnlySchema>>,
) {
  const fields = z.flattenError(error).fieldErrors;
  return {
    email: fields.email?.[0],
  } satisfies AuthAccessActionState["fieldErrors"];
}

function getLoginFieldErrors(error: z.ZodError<z.infer<typeof loginSchema>>) {
  const fields = z.flattenError(error).fieldErrors;
  return {
    email: fields.email?.[0],
    password: fields.password?.[0],
    code: fields.code?.[0],
  } satisfies LoginActionState["fieldErrors"];
}

function getRegisterFieldErrors(
  error: z.ZodError<z.infer<typeof registerSchema>>,
) {
  const fields = z.flattenError(error).fieldErrors;
  return {
    email: fields.email?.[0],
    password: fields.password?.[0],
    confirmPassword: fields.confirmPassword?.[0],
  } satisfies RegisterActionState["fieldErrors"];
}

function buildTurnstileFailureState({
  mode,
  message,
  rawEmail,
  code = "",
}: {
  mode: AccessMode;
  message: string;
  rawEmail: string;
  code?: string;
}): AuthAccessActionState {
  return {
    mode,
    error: message,
    fieldErrors: {
      turnstile: message,
    },
    values: {
      email: rawEmail,
      code,
    },
    twoFactorRequired: code.trim().length > 0,
  };
}

export async function authAccessAction(
  previousState: AuthAccessActionState,
  formData: FormData,
): Promise<AuthAccessActionState> {
  const intent = String(formData.get("intent") ?? "resolve");
  const rawEmail = String(formData.get("email") ?? "").trim();
  const normalizedEmail = rawEmail.toLowerCase();

  if (intent === "resolve") {
    const parsed = emailOnlySchema.safeParse({ email: normalizedEmail });
    if (!parsed.success) {
      return {
        mode: "email",
        error: "Enter a valid email address.",
        fieldErrors: getEmailFieldErrors(parsed.error),
        values: { email: rawEmail, code: "" },
      };
    }

    const turnstileResult = await verifyTurnstileToken(
      String(formData.get("cf-turnstile-response") ?? ""),
    );

    if (!turnstileResult.ok) {
      return buildTurnstileFailureState({
        mode: "email",
        message: turnstileResult.message,
        rawEmail,
      });
    }

    await grantTurnstileAccess(parsed.data.email);

    let existingUser;
    try {
      existingUser = await getUserByEmail(parsed.data.email);
    } catch {
      return {
        mode: "email",
        error:
          "The sign-in service is unavailable right now. Please try again in a moment.",
        fieldErrors: initialFieldErrors,
        values: { email: parsed.data.email, code: "" },
      };
    }

    if (!existingUser) {
      return {
        mode: "register",
        fieldErrors: initialFieldErrors,
        values: { email: parsed.data.email, code: "" },
      };
    }

    if (!existingUser.password) {
      return {
        mode: "oauth",
        success:
          "This email already has an account that signs in without a password. Use Google to continue.",
        fieldErrors: initialFieldErrors,
        values: { email: parsed.data.email, code: "" },
      };
    }

    return {
      mode: "login",
      fieldErrors: initialFieldErrors,
      values: { email: parsed.data.email, code: "" },
    };
  }

  if (intent === "change-email") {
    await clearTurnstileAccess();

    return {
      mode: "email",
      fieldErrors: initialFieldErrors,
      values: { email: normalizedEmail, code: "" },
    };
  }

  if (intent === "login") {
    const hasVerifiedAccess = await hasTurnstileAccess(normalizedEmail);

    if (!hasVerifiedAccess) {
      const turnstileResult = await verifyTurnstileToken(
        String(formData.get("cf-turnstile-response") ?? ""),
      );

      if (!turnstileResult.ok) {
        return buildTurnstileFailureState({
          mode: "login",
          message: turnstileResult.message,
          rawEmail,
          code: String(formData.get("code") ?? ""),
        });
      }

      await grantTurnstileAccess(normalizedEmail);
    }

    const values = {
      email: normalizedEmail,
      password: String(formData.get("password") ?? ""),
      code: String(formData.get("code") ?? ""),
    };

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      return {
        mode: "login",
        error: "Please correct the highlighted fields.",
        fieldErrors: getLoginFieldErrors(parsed.error),
        values: { email: rawEmail, code: values.code },
        twoFactorRequired: values.code.trim().length > 0,
      };
    }

    const result = await login(parsed.data);

    const invalidCredentials = result.error === "Invalid email or password";

    return {
      mode: "login",
      error: result.error,
      success: result.success,
      twoFactorRequired:
        result.twoFactorRequired ?? (parsed.data.code?.trim()?.length ?? 0) > 0,
      fieldErrors: invalidCredentials
        ? {
            password: "Invalid email or password",
          }
        : initialFieldErrors,
      values: {
        email: parsed.data.email,
        code: parsed.data.code ?? "",
      },
    };
  }

  if (intent === "register") {
    const hasVerifiedAccess = await hasTurnstileAccess(normalizedEmail);

    if (!hasVerifiedAccess) {
      const turnstileResult = await verifyTurnstileToken(
        String(formData.get("cf-turnstile-response") ?? ""),
      );

      if (!turnstileResult.ok) {
        return buildTurnstileFailureState({
          mode: "register",
          message: turnstileResult.message,
          rawEmail,
        });
      }

      await grantTurnstileAccess(normalizedEmail);
    }

    const values = {
      email: normalizedEmail,
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    };

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      return {
        mode: "register",
        error: "Please correct the highlighted fields.",
        fieldErrors: getRegisterFieldErrors(parsed.error),
        values: { email: rawEmail, code: "" },
      };
    }

    const result = await registerUser(parsed.data);

    if (result?.error === "Email already taken!") {
      return {
        mode: "login",
        error: "This email already has an account. Sign in below.",
        fieldErrors: initialFieldErrors,
        values: { email: parsed.data.email, code: "" },
      };
    }

    return {
      mode: "register",
      error: result?.error,
      success: result?.success,
      values: { email: parsed.data.email, code: "" },
      fieldErrors: initialFieldErrors,
    };
  }

  return previousState;
}
