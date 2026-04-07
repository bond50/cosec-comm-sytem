"use client";

import { useActionState } from "react";
import {
  requestPasswordResetAction,
  type ResetPasswordActionState,
} from "@/features/auth/actions/reset-password";
import { AuthFeedback } from "@/features/auth/components/auth-feedback";
import { AuthInlineError } from "@/features/auth/components/auth-inline-error";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";

const initialPasswordSetupState: ResetPasswordActionState = {
  values: {
    email: "",
  },
};

type OAuthPasswordSetupFormProps = {
  email: string;
};

export function OAuthPasswordSetupForm({ email }: OAuthPasswordSetupFormProps) {
  const [state, action] = useActionState(
    requestPasswordResetAction,
    initialPasswordSetupState,
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="email" value={email} />
      <AuthSubmitButton variant="outline">
        Email me a link to set a password
      </AuthSubmitButton>

      <AuthInlineError message={state.error} />

      <AuthFeedback
        type="info"
        title="Check your email"
        message={state.success}
        icon="mail"
      />
    </form>
  );
}
