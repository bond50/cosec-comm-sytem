"use client";

import { Send } from "lucide-react";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";

type ChallengeResendFormProps = {
  action: (formData: FormData) => void;
  next?: string;
  formRef: React.RefObject<HTMLFormElement | null>;
};

export function ChallengeResendForm({
  action,
  next,
  formRef,
}: ChallengeResendFormProps) {
  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="next" value={next ?? ""} />
      <AuthSubmitButton className="flex-1" variant="outline" icon={<Send />}>
        Resend code
      </AuthSubmitButton>
    </form>
  );
}
