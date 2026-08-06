"use client";

import { AuthOtpField } from "@/features/auth/components/auth-otp-field";

type ChallengeVerifyFormProps = {
  action: (formData: FormData) => void;
  formId: string;
  next?: string;
  error?: string;
  success?: string;
};

export function ChallengeVerifyForm({
  action,
  formId,
  next,
  error,
}: ChallengeVerifyFormProps) {
  return (
    <form id={formId} action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <AuthOtpField id="challenge-code" error={error} required />
    </form>
  );
}
