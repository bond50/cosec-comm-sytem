import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      isTwoFAEnabled: boolean;
      isOAuth: boolean;
    };
    organization: {
      id: string;
      name: string;
      slug: string;
      role: UserRole;
    } | null;
    mfaRequired: boolean;
    mfaVerified: boolean;
  }

  interface User {
    id?: string;
    isTwoFAEnabled?: boolean;
    isOAuth?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    organizationId?: string;
    organizationName?: string;
    organizationSlug?: string;
    organizationRole?: UserRole;
    isOAuth?: boolean;
    isTwoFAEnabled?: boolean;
    mfaRequired?: boolean;
    mfaVerified?: boolean;
    image?: string;
  }
}
