import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { getUserByEmail } from "@/features/auth/queries/user";
import bcrypt from "bcryptjs";
import Google from "next-auth/providers/google";
import { loginSchema } from "@/features/auth/schemas/auth";

export default {
  providers: [
    Google({
      authorization: { params: { prompt: "select_account" } },
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials);
        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          const user = await getUserByEmail(email);
          if (!user || !user.password || !user.emailVerified) return null;
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (isPasswordValid) return user;
        }
        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;
