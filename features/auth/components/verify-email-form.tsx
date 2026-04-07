"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import {
  resendVerificationEmailAction,
  type VerifyEmailActionState,
} from "@/features/auth/actions/resend-verification";
import { AuthFormStatus } from "@/features/auth/components/auth-form-status";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import { FloatingInput } from "@/features/auth/components/floating-input";

type VerifyEmailFormProps = {
  initialEmail?: string;
  organizationName?: string;
};

export function VerifyEmailForm({
  initialEmail = "",
  organizationName,
}: VerifyEmailFormProps) {
  const initialState: VerifyEmailActionState = {
    fieldErrors: {},
    values: { email: initialEmail },
  };

  const [state, action] = useActionState(
    resendVerificationEmailAction,
    initialState,
  );

  return (
    <AuthShell
      title="Verify your email"
      description="Check your inbox for the activation link. You can request a fresh one below."
      footerText="Already verified?"
      footerLinkHref="/auth/login"
      footerLinkLabel="Sign in"
      organizationName={organizationName}
    >
      <form className="space-y-5" action={action}>
        <FloatingInput
          id="verify-email"
          name="email"
          label="Email address"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email ?? initialEmail}
          error={state.fieldErrors?.email}
          required
        />

        <AuthFormStatus
          error={state.error}
          success={state.success}
          successTitle="Activation email sent"
        />

        <AuthSubmitButton icon={<MailCheck />}>
          Resend activation link
        </AuthSubmitButton>
      </form>
    </AuthShell>
  );
}
