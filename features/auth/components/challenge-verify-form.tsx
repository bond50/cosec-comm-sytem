"use client";

import { AuthFeedback } from "@/features/auth/components/auth-feedback";
import { AuthOtpField } from "@/features/auth/components/auth-otp-field";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";

type ChallengeVerifyFormProps = {
  action: (formData: FormData) => void;
  next?: string;
  error?: string;
  success?: string;
};

export function ChallengeVerifyForm({
  action,
  next,
  error,
  success,
}: ChallengeVerifyFormProps) {
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <AuthOtpField id="challenge-code" error={error} required />
      <AuthFeedback
        type="info"
        title="Verification message"
        message={success}
        icon="mail"
      />

      <AuthSubmitButton className="flex-1">
        Verify and continue
      </AuthSubmitButton>
    </form>
  );
}
