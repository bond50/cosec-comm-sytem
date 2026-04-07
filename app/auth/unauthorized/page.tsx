import { ShieldAlert } from "lucide-react";
import { AuthStatusCard } from "@/features/auth/components/auth-status-card";

export default function UnauthorizedPage() {
  return (
    <AuthStatusCard
      title="Credentials required"
      description="This account cannot continue with the selected method. Sign in with your verified password or request a reset link."
      icon={<ShieldAlert className="h-6 w-6" />}
      primaryHref="/auth/login"
      primaryLabel="Sign in"
      secondaryHref="/auth/reset"
      secondaryLabel="Reset password"
    />
  );
}
