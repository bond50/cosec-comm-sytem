// auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { UserRole } from "@prisma/client";
import authConfig from "@/auth.config";
import { db } from "@/lib/db";
import { getUserById } from "@/features/auth/queries/user";
import { getActiveOrganizationMembershipByUserId } from "@/features/auth/queries/organization-membership";
import { getTwoFactorConfirmationByUserId } from "@/features/auth/queries/two-factor-confirmation";
import { getAccountByUserId } from "@/features/auth/queries/account";
import { isAdminRole } from "@/features/auth/utils/roles";
import { forbiddenRoute, unauthorizedRoute } from "@/routes";

export const { auth, handlers, signIn, signOut, unstable_update } = NextAuth({
  adapter: PrismaAdapter(db),

  pages: { signIn: "/auth/login", error: "/auth/error" },

  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },

    async createUser({ user }) {
      const email = (user?.email ?? "").toLowerCase();
      if (!email) return;

      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },

  callbacks: {
    async signIn({ user, account }) {
      const email = (user?.email ?? "").toLowerCase();
      const provider = account?.provider ?? "unknown";

      if (!email) {
        return provider === "credentials" ? unauthorizedRoute : forbiddenRoute;
      }

      const existing = await db.user.findUnique({
        where: { email },
        select: { id: true, emailVerified: true },
      });

      if (existing) {
        if (provider !== "credentials") {
          const linkedProviderAccount = await db.account.findFirst({
            where: {
              userId: existing.id,
              provider,
            },
            select: { id: true },
          });

          await db.user.update({
            where: { id: existing.id },
            data: {
              emailVerified: existing.emailVerified ?? new Date(),
            },
          });

          const activeMembership =
            await getActiveOrganizationMembershipByUserId(existing.id);

          // First-time Google linking for an admin should not immediately bounce into the challenge.
          if (isAdminRole(activeMembership?.role) && !linkedProviderAccount) {
            const prior = await getTwoFactorConfirmationByUserId(existing.id);
            if (!prior) {
              await db.twoFactorConfirmation.create({
                data: { userId: existing.id },
              });
            }
          }
        }

        return true;
      }

      if (provider !== "credentials") {
        return true;
      }

      return unauthorizedRoute;
    },

    async jwt({ token, trigger, session }) {
      if (!token.sub) return token;

      const dbUser = await getUserById(token.sub);
      if (!dbUser) return token;

      const existingAccount = await getAccountByUserId(dbUser.id);
      const activeMembership = await getActiveOrganizationMembershipByUserId(
        dbUser.id,
      );

      if (typeof dbUser.image === "string") {
        token.picture = dbUser.image;
        token.image = dbUser.image;
      }

      const isTwoFAEnabled = dbUser.isTwoFAEnabled ?? false;
      const requiresChallenge =
        isAdminRole(activeMembership?.role) || isTwoFAEnabled;

      token.isOAuth = !!existingAccount;
      token.mfaRequired = requiresChallenge;
      token.isTwoFAEnabled = isTwoFAEnabled;
      token.organizationId = activeMembership?.organization.id;
      token.organizationName = activeMembership?.organization.name;
      token.organizationSlug = activeMembership?.organization.slug;
      token.organizationRole = activeMembership?.role;
      if (typeof token.mfaVerified !== "boolean") {
        token.mfaVerified = false;
      }

      const confirmation = await getTwoFactorConfirmationByUserId(dbUser.id);
      if (confirmation) {
        token.mfaVerified = true;
        await db.twoFactorConfirmation.delete({
          where: { id: confirmation.id },
        });
      }

      if (!requiresChallenge) {
        token.mfaVerified = true;
      }

      if (trigger === "update" && session?.mfaVerified === true) {
        token.mfaVerified = true;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.mfaRequired = Boolean(token.mfaRequired);
        session.mfaVerified = Boolean(token.mfaVerified);
        session.organization = token.organizationId
          ? {
              id: token.organizationId,
              name: token.organizationName ?? "",
              slug: token.organizationSlug ?? "",
              role: (token.organizationRole as UserRole) ?? UserRole.USER,
            }
          : null;

        session.user.id = token.sub ?? "";
        session.user.isTwoFAEnabled = Boolean(token.isTwoFAEnabled);
        session.user.isOAuth = Boolean(token.isOAuth);

        if (typeof token.name === "string") session.user.name = token.name;
        if (typeof token.email === "string") session.user.email = token.email;

        if (typeof token.picture === "string") {
          session.user.image = token.picture;
        } else if (typeof token.image === "string") {
          session.user.image = token.image;
        } else {
          session.user.image = session.user.image ?? "";
        }
      }
      return session;
    },

    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.origin === baseUrl ? url : baseUrl;
      } catch {
        return baseUrl;
      }
    },
  },

  session: { strategy: "jwt" },

  ...authConfig,
});
