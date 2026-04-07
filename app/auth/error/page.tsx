import { AlertTriangle } from "lucide-react";
import { AuthStatusCard } from "@/features/auth/components/auth-status-card";

type ErrorPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  switch (error) {
    case "OAuthAccountNotLinked":
      return "This email is already linked to another sign-in method. Use the method you registered with or request a password setup link.";
    case "AccessDenied":
      return "Access was denied for this sign-in attempt.";
    default:
      return "We could not complete the sign-in request. Try again or use a different authentication method.";
  }
}

export default async function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const { error } = await searchParams;

  return (
    <AuthStatusCard
      title="Authentication error"
      description={getErrorMessage(error)}
      icon={<AlertTriangle className="h-6 w-6" />}
      primaryHref="/auth/login"
      primaryLabel="Back to sign in"
      secondaryHref="/auth/reset"
      secondaryLabel="Reset password"
    />
  );
}
