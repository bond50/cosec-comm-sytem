"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  loginAction,
  type LoginActionState,
} from "@/features/auth/actions/login";
import { AuthDivider } from "@/features/auth/components/auth-divider";
import { AuthFormStatus } from "@/features/auth/components/auth-form-status";
import { AuthOtpField } from "@/features/auth/components/auth-otp-field";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import { GoogleLoginButton } from "@/features/auth/components/google-login-button";
import { PasswordInput } from "@/features/auth/components/password-input";
import { FloatingInput } from "@/features/auth/components/floating-input";

const initialState: LoginActionState = {
  fieldErrors: {},
  values: {
    email: "",
    code: "",
  },
};

type LoginFormProps = {
  organizationName?: string;
};

export function LoginForm({ organizationName }: LoginFormProps) {
  const [state, action] = useActionState(loginAction, initialState);
  const twoFactorRequired = state.twoFactorRequired ?? false;
  const statusMessage =
    state.success ??
    (twoFactorRequired && !state.error
      ? "A verification code has been sent to your email."
      : "");

  return (
    <AuthShell
      title="Sign in to your account"
      description="Use your email and password to continue."
      footerText="Not registered yet?"
      footerLinkHref="/auth/register"
      footerLinkLabel="Create an account"
      organizationName={organizationName}
    >
      <form className="auth-login-form space-y-4" action={action}>
        <FloatingInput
          id="email"
          name="email"
          label="Email address"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email ?? ""}
          error={state.fieldErrors?.email}
          required
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <Link
              href="/auth/reset"
              className="text-sm font-semibold text-[var(--brand)] hover:opacity-85"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            label="Password"
            autoComplete="current-password"
            error={state.fieldErrors?.password}
            containerClassName="space-y-0"
            required
          />
        </div>

        {twoFactorRequired ? (
          <AuthOtpField
            error={state.fieldErrors?.code}
            defaultValue={state.values?.code ?? ""}
            required
          />
        ) : null}

        <AuthFormStatus error={state.error} success={statusMessage} />

        <AuthSubmitButton>
          {twoFactorRequired ? "Verify and continue" : "Sign in"}
        </AuthSubmitButton>
      </form>

      <AuthDivider />
      <GoogleLoginButton />
    </AuthShell>
  );
}
