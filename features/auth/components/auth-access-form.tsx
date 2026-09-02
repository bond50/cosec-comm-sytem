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
      ? ""
      : mode === "login"
        ? "Password"
        : mode === "register"
          ? "Create password"
          : "Google sign-in";
  const shellDescription =
    mode === "email"
      ? ""
      : mode === "login"
        ? ""
        : mode === "register"
          ? ""
          : "";
  const shellEyebrow = undefined;

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
            nameValue={state.values?.name ?? ""}
            nameError={fieldErrors.name}
            passwordError={fieldErrors.password}
            confirmPasswordError={fieldErrors.confirmPassword}
            inputErrorClass={authInputErrorClass}
            onNameChange={() => {
              if (localErrors.name) {
                setLocalErrors((current) =>
                  clearAuthAccessErrors(current, ["name"]),
                );
              }
            }}
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
            title="Google sign-in required"
            message="Continue with Google or send yourself a password setup link."
          />
        ) : null}

        {mode === "email" ? (
          <AuthSubmitButton>Continue</AuthSubmitButton>
        ) : null}

        <AuthInlineError message={formLevelError} />

        {!registrationComplete &&
        statusMessage &&
        !(mode === "login" && twoFactorRequired) ? (
          <AuthFeedback
            type="info"
            title="Check your email"
            message={statusMessage}
            icon="mail"
          />
        ) : null}

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
