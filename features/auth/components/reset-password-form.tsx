"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import {
  requestPasswordResetAction,
  type ResetPasswordActionState,
} from "@/features/auth/actions/reset-password";
import { AuthFormStatus } from "@/features/auth/components/auth-form-status";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import { FloatingInput } from "@/features/auth/components/floating-input";

const initialState: ResetPasswordActionState = {
  fieldErrors: {},
  values: { email: "" },
};

type ResetPasswordFormProps = {
  organizationName?: string;
};

export function ResetPasswordForm({
  organizationName,
}: ResetPasswordFormProps) {
  const [state, action] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your email address and we will send you a secure reset link."
      footerText="Remembered your password?"
      footerLinkHref="/auth/login"
      footerLinkLabel="Back to sign in"
      organizationName={organizationName}
    >
      <form className="space-y-5" action={action}>
        <FloatingInput
          id="reset-email"
          name="email"
          label="Email address"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email ?? ""}
          error={state.fieldErrors?.email}
          required
        />

        <AuthFormStatus error={state.error} success={state.success} />

        <AuthSubmitButton icon={<Mail />}>Send reset link</AuthSubmitButton>
      </form>
    </AuthShell>
  );
}
