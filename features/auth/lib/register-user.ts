import bcrypt from "bcryptjs";
import * as z from "zod";

import { db } from "@/lib/db";
import { registerSchema } from "@/features/auth/schemas/auth";
import { generateVerificationToken } from "@/features/auth/queries/tokens";
import { sendVerificationEmail } from "@/features/auth/utils/auth-email";
import { getUserByEmail } from "@/features/auth/queries/user";

export type RegisterUserResult = {
  error?: string;
  success?: string;
};

export async function registerUser(
  values: z.infer<typeof registerSchema>,
): Promise<RegisterUserResult> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Invalid fields!" };
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await getUserByEmail(normalizedEmail);
  if (existing) {
    return { error: "Email already taken!" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
    },
  });

  const verificationToken = await generateVerificationToken(normalizedEmail);
  const delivery = await sendVerificationEmail(
    verificationToken.email,
    verificationToken.token,
  );

  if (!delivery.ok) {
    return {
      error:
        "Account created, but the verification email could not be sent. Try again from the verification page shortly.",
    };
  }

  if (delivery.simulated && delivery.actionUrl) {
    return {
      success: `Account created. Development verification link: ${delivery.actionUrl}`,
    };
  }

  return {
    success: "Check your email to verify your account before signing in.",
  };
}
