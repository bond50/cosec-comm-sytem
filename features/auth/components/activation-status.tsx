// features/auth/components/activation-status.tsx
import { CheckCircle2, MailWarning } from "lucide-react";
import { AuthStatusCard } from "@/features/auth/components/auth-status-card";

type ActivationStatusProps = {
  success?: string;
  error?: string;
};

export function ActivationStatus({ success, error }: ActivationStatusProps) {
  if (success) {
    return (
      <AuthStatusCard
        title="Email verified"
        description={success}
        icon={<CheckCircle2 className="h-6 w-6" />}
        primaryHref="/auth/login"
        primaryLabel="Continue to sign in"
      />
    );
  }

  return (
    <AuthStatusCard
      title="Activation required"
      description={
        error ??
        "This activation link is not valid anymore. Request a fresh one to continue."
      }
      icon={<MailWarning className="h-6 w-6" />}
      primaryHref="/auth/verify-email"
      primaryLabel="Request new link"
      secondaryHref="/auth/login"
      secondaryLabel="Back to sign in"
    />
  );
}
