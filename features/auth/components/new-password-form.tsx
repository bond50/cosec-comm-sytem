"use client";

import Link from "next/link";
import { useActionState, useEffect, useEffectEvent } from "react";
import { useRouter } from "next/navigation";
import {
  resetPasswordWithTokenAction,
  type NewPasswordActionState,
} from "@/features/auth/actions/new-password";
import { AuthFormStatus } from "@/features/auth/components/auth-form-status";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import { PasswordInput } from "@/features/auth/components/password-input";

type NewPasswordFormProps = {
  token?: string;
  email?: string;
  organizationName?: string;
};

const initialState: NewPasswordActionState = {
  fieldErrors: {},
};

export function NewPasswordForm({
  token,
  email = "",
  organizationName,
}: NewPasswordFormProps) {
  const router = useRouter();
  const actionWithToken = resetPasswordWithTokenAction.bind(null, token);
  const [state, action] = useActionState(actionWithToken, initialState);
  const redirectToLogin = useEffectEvent(() => {
    router.push("/auth/login");
  });

  useEffect(() => {
    if (!state.success) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      redirectToLogin();
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [state.success]);

  return (
    <AuthShell
      title="Choose a new password"
      description="Set a new password for your account, then return to sign in."
      footerText="Need a new reset link?"
      footerLinkHref="/auth/reset"
      footerLinkLabel="Request one"
      organizationName={organizationName}
    >
      <form className="space-y-5" action={action}>
        <input
          type="email"
          name="email"
          autoComplete="username"
          defaultValue={email}
          className="hidden"
          readOnly
          tabIndex={-1}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordInput
            id="new-password"
            name="password"
            label="New password"
            autoComplete="new-password"
            error={state.fieldErrors?.password}
            description="Use at least 8 characters with upper, lower, number, and symbol."
            required
          />

          <PasswordInput
            id="confirm-new-password"
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

        <AuthSubmitButton disabled={!token}>Update password</AuthSubmitButton>

        {!token ? (
          <p className="text-sm text-slate-600">
            This reset link is missing a token.{" "}
            <Link
              className="font-semibold text-[var(--brand)]"
              href="/auth/reset"
            >
              Request a new reset email.
            </Link>
          </p>
        ) : null}
      </form>
    </AuthShell>
  );
}
