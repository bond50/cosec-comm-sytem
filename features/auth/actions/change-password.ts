"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { auth, unstable_update } from "@/auth";
import { db } from "@/lib/db";
import { newPasswordSchema } from "@/features/auth/schemas/auth";

export type ChangePasswordActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<"password" | "confirmPassword", string>>;
};

function getChangePasswordFieldErrors(
  error: z.ZodError<z.infer<typeof newPasswordSchema>>,
) {
  const fields = z.flattenError(error).fieldErrors;

  return {
    password: fields.password?.[0],
    confirmPassword: fields.confirmPassword?.[0],
  } satisfies ChangePasswordActionState["fieldErrors"];
}

export async function changePasswordAction(
  _previousState: ChangePasswordActionState,
  formData: FormData,
): Promise<ChangePasswordActionState> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "Your session has expired. Sign in again." };
  }

  const values = {
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };

  const parsed = newPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: getChangePasswordFieldErrors(parsed.error),
    };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

  await db.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
    },
  });

  await unstable_update({});

  return { success: "Password updated." };
}
