import { Ban } from "lucide-react";
import { AuthStatusCard } from "@/features/auth/components/auth-status-card";

export default function ForbiddenPage() {
  return (
    <AuthStatusCard
      title="Access restricted"
      description="Your account signed in successfully, but you do not have permission to open this area."
      icon={<Ban className="h-6 w-6" />}
      primaryHref="/"
      primaryLabel="Return home"
      secondaryHref="/auth/login"
      secondaryLabel="Use another account"
    />
  );
}
