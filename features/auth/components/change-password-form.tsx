"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  changePasswordAction,
  type ChangePasswordActionState,
} from "@/features/auth/actions/change-password";
import { AuthFormStatus } from "@/features/auth/components/auth-form-status";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import { PasswordInput } from "@/features/auth/components/password-input";

type ChangePasswordFormProps = {
  next: string;
  organizationName?: string;
};

const initialState: ChangePasswordActionState = { fieldErrors: {} };

export function ChangePasswordForm({
  next,
  organizationName,
}: ChangePasswordFormProps) {
  const router = useRouter();
  const [state, action] = useActionState(changePasswordAction, initialState);

  useEffect(() => {
    if (!state.success) return;
    router.replace(next);
  }, [next, router, state.success]);

  return (
    <AuthShell
      title="Set your password"
      description="You're signing in with a temporary password. Choose a new one to continue."
      organizationName={organizationName}
    >
      <form className="space-y-5" action={action}>
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordInput
            id="change-password"
            name="password"
            label="New password"
            autoComplete="new-password"
            error={state.fieldErrors?.password}
            description="Use at least 8 characters with upper, lower, number, and symbol."
            required
          />
          <PasswordInput
            id="change-confirm-password"
            name="confirmPassword"
            label="Confirm password"
            autoComplete="new-password"
            error={state.fieldErrors?.confirmPassword}
            required
          />
        </div>

        <AuthFormStatus
          error={state.error}
          success={state.success}
          successTitle=""
          successType="success"
        />

        <AuthSubmitButton>Set password and continue</AuthSubmitButton>
      </form>
    </AuthShell>
  );
}
