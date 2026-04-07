"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { FieldError } from "@/components/ui/field";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import {
  authAccessAction,
  type AuthAccessActionState,
} from "@/features/auth/actions/access";
import { AuthDivider } from "@/features/auth/components/auth-divider";
import { AuthFeedback } from "@/features/auth/components/auth-feedback";
import { AuthInlineError } from "@/features/auth/components/auth-inline-error";
import { AuthAccessEmailStep } from "@/features/auth/components/auth-access-email-step";
import { AuthAccessEmailSummary } from "@/features/auth/components/auth-access-email-summary";
import { AuthAccessLoginStep } from "@/features/auth/components/auth-access-login-step";
import { AuthAccessRegisterStep } from "@/features/auth/components/auth-access-register-step";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import { GoogleLoginButton } from "@/features/auth/components/google-login-button";
import {
  authInputErrorClass,
  clearAuthAccessErrors,
  getAuthAccessFieldErrors,
  getAuthAccessIntent,
  validateAuthAccessSubmit,
  type AuthAccessLocalFieldErrors,
} from "@/features/auth/lib/auth-access-validation";
import { OAuthPasswordSetupForm } from "@/features/auth/components/oauth-password-setup-form";
import {
  readLastAuthMethod,
  setStoredLastAuthMethod,
  subscribeToLastAuthMethod,
} from "@/features/auth/utils/last-auth-method";

type AuthAccessFormProps = {
  organizationName?: string;
  initialEmail?: string;
  initialMode?: AuthAccessActionState["mode"];
  initialSuccessMessage?: string;
};

export function AuthAccessForm({
  organizationName,
  initialEmail = "",
  initialMode = "email",
  initialSuccessMessage,
}: AuthAccessFormProps) {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [localErrors, setLocalErrors] = useState<AuthAccessLocalFieldErrors>(
    {},
  );
  const [modeOverride, setModeOverride] = useState<
    AuthAccessActionState["mode"] | null
  >(null);
  const [state, action] = useActionState(authAccessAction, {
    mode: initialMode,
    fieldErrors: {},
    values: {
      email: initialEmail,
      code: "",
    },
    success: initialSuccessMessage,
  });

  const lastAuthMethod = useSyncExternalStore(
    subscribeToLastAuthMethod,
    readLastAuthMethod,
    () => null,
  );

  const mode = modeOverride ?? state.mode ?? "email";
  const emailValue = state.values?.email ?? "";
  const twoFactorRequired = state.twoFactorRequired ?? false;
  const registrationComplete =
    mode === "register" && Boolean(state.success) && !state.error;
  const fieldErrors = getAuthAccessFieldErrors(localErrors, state.fieldErrors);
  const statusMessage =
    state.success ??
    (twoFactorRequired && !state.error
      ? "A verification code has been sent to your email."
      : "");
  const formLevelError = fieldErrors.turnstile ? undefined : state.error;
  const shellTitle =
    mode === "email"
      ? "Access the workspace"
      : mode === "login"
        ? "Sign in to continue"
        : mode === "register"
          ? "Create your credentials"
          : "Choose your sign-in path";
  const shellDescription =
    mode === "email"
      ? "Start with your email address. The system will guide you to password login, registration, or Google sign-in based on the account state."
      : mode === "login"
        ? "Use your account password to continue into the protected business area."
        : mode === "register"
          ? "Finish setting up credentials so this email can access the organization workspace."
          : "This account is linked to Google. Continue with Google or email yourself a secure link to add a password.";
  const shellEyebrow =
    mode === "email"
      ? "Account access"
      : mode === "login"
        ? "Password sign-in"
        : mode === "register"
          ? "First-time setup"
          : "Google-linked account";

  const resetToEmailStep = () => {
    setModeOverride("email");
    setLocalErrors({});
    setTurnstileToken("");
  };

  return (
    <AuthShell
      title={shellTitle}
      description={shellDescription}
      eyebrow={shellEyebrow}
      footerText="Need a different path?"
      footerLinkHref="/auth/reset"
      footerLinkLabel="Reset password"
      organizationName={organizationName}
    >
      <form
        className="space-y-4"
        action={action}
        onSubmit={(event) => {
          const formData = new FormData(event.currentTarget);
          const validationErrors = validateAuthAccessSubmit({
            formData,
            mode,
            emailValue,
            registrationComplete,
            turnstileToken,
          });

          if (validationErrors) {
            event.preventDefault();
            setLocalErrors(validationErrors);
            return;
          }

          if (mode !== "email") {
            setStoredLastAuthMethod("credentials");
          }

          setLocalErrors({});
          setModeOverride(null);
        }}
      >
        <input type="hidden" name="intent" value={getAuthAccessIntent(mode)} />

        <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Current step
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-950">
            {mode === "email"
              ? "Identify the account"
              : mode === "login"
                ? "Enter password"
                : mode === "register"
                  ? "Create credentials"
                  : "Use Google or add a password"}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {mode === "email"
              ? "We first determine whether this email should sign in, register, or use Google."
              : mode === "login"
                ? "Complete authentication to enter the protected workspace."
                : mode === "register"
                  ? "Register this email with a password before access is granted."
                  : "Choose the safest route for a Google-linked account."}
          </p>
        </div>

        {mode === "email" ? (
          <AuthAccessEmailStep
            emailValue={emailValue}
            emailError={fieldErrors.email}
            inputErrorClass={authInputErrorClass}
            showLastUsedBadge={lastAuthMethod === "credentials"}
            onEmailChange={() => {
              if (localErrors.email) {
                setLocalErrors((current) =>
                  clearAuthAccessErrors(current, ["email"]),
                );
              }
            }}
          />
        ) : (
          <AuthAccessEmailSummary
            emailValue={emailValue}
            onChangeEmail={resetToEmailStep}
          />
        )}

        {mode === "login" ? (
          <AuthAccessLoginStep
            passwordError={fieldErrors.password}
            codeError={fieldErrors.code}
            codeDefaultValue={state.values?.code ?? ""}
            inputErrorClass={authInputErrorClass}
            twoFactorRequired={twoFactorRequired}
            onPasswordChange={() => {
              if (localErrors.password) {
                setLocalErrors((current) =>
                  clearAuthAccessErrors(current, ["password"]),
                );
              }
            }}
          />
        ) : null}

        {mode === "register" ? (
          <AuthAccessRegisterStep
            registrationComplete={registrationComplete}
            emailValue={emailValue}
            successMessage={state.success}
            passwordError={fieldErrors.password}
            confirmPasswordError={fieldErrors.confirmPassword}
            inputErrorClass={authInputErrorClass}
            onPasswordChange={() => {
              if (localErrors.password || localErrors.confirmPassword) {
                setLocalErrors((current) =>
                  clearAuthAccessErrors(current, [
                    "password",
                    "confirmPassword",
                  ]),
                );
              }
            }}
            onConfirmPasswordChange={() => {
              if (localErrors.confirmPassword) {
                setLocalErrors((current) =>
                  clearAuthAccessErrors(current, ["confirmPassword"]),
                );
              }
            }}
            onUseAnotherEmail={resetToEmailStep}
          />
        ) : null}

        {mode === "oauth" ? (
          <AuthFeedback
            title="Google sign-in found for this email"
            message="This account does not have a saved password yet. Continue with Google below, or email yourself a secure link to add a password."
          />
        ) : null}

        {mode === "email" ? (
          <AuthSubmitButton>Continue</AuthSubmitButton>
        ) : null}

        <AuthInlineError message={formLevelError} />

        <AuthFeedback
          type="info"
          title="Check your email"
          message={!registrationComplete ? statusMessage : undefined}
          icon="mail"
        />

        {mode === "email" ? (
          <>
            <TurnstileWidget
              value={turnstileToken}
              onChangeAction={(token) => {
                setTurnstileToken(token);

                if (localErrors.turnstile) {
                  setLocalErrors((current) =>
                    clearAuthAccessErrors(current, ["turnstile"]),
                  );
                }
              }}
              className="pt-0.5"
            />
            <FieldError>{fieldErrors.turnstile}</FieldError>
          </>
        ) : null}
      </form>

      {mode === "oauth" ? <OAuthPasswordSetupForm email={emailValue} /> : null}

      {!registrationComplete ? (
        <>
          <AuthDivider />
          <GoogleLoginButton showLastUsedBadge={lastAuthMethod === "google"} />
        </>
      ) : null}
    </AuthShell>
  );
}
