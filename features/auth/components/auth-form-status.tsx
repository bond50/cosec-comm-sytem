import { AuthFeedback } from "@/features/auth/components/auth-feedback";

type AuthFormStatusProps = {
  error?: string;
  success?: string;
  successTitle?: string;
  successType?: "info" | "success";
};

export function AuthFormStatus({
  error,
  success,
  successTitle = "Check your email",
  successType = "info",
}: AuthFormStatusProps) {
  return (
    <>
      <AuthFeedback type="error" message={error} />
      <AuthFeedback
        type={successType}
        title={successTitle}
        message={success}
        icon={successType === "info" ? "mail" : undefined}
      />
    </>
  );
}
