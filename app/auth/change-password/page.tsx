import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { getPortalBranding } from "@/features/application/queries/settings";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

type ChangePasswordPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

function normalizeNext(next?: string): string {
  if (typeof next !== "string" || !next.startsWith("/")) {
    return DEFAULT_LOGIN_REDIRECT;
  }

  return next;
}

export default async function ChangePasswordPage({
  searchParams,
}: ChangePasswordPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const { next } = await searchParams;
  const branding = await getPortalBranding();

  return (
    <ChangePasswordForm
      next={normalizeNext(next)}
      organizationName={branding.organizationName}
    />
  );
}
