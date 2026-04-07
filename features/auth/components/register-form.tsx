"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";

import { AuthDivider } from "@/features/auth/components/auth-divider";
import { AuthFormStatus } from "@/features/auth/components/auth-form-status";
import { AuthCreatePasswordFields } from "@/features/auth/components/auth-create-password-fields";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  registerAction,
  type RegisterActionState,
} from "@/features/auth/actions/register";
import {
  registerInputErrorClass,
  validateRegisterFormSubmit,
  type RegisterFormLocalFieldErrors,
} from "@/features/auth/lib/register-form-validation";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { GoogleLoginButton } from "@/features/auth/components/google-login-button";

const initialState: RegisterActionState = {
  fieldErrors: {},
  values: {
    email: "",
  },
};

type RegisterFormProps = {
  organizationName?: string;
};

export function RegisterForm({ organizationName }: RegisterFormProps) {
  const [state, action] = useActionState(registerAction, initialState);
  const [localErrors, setLocalErrors] = useState<RegisterFormLocalFieldErrors>(
    {},
  );

  const fieldErrors = {
    email: localErrors.email ?? state.fieldErrors?.email,
    password: localErrors.password ?? state.fieldErrors?.password,
    confirmPassword:
      localErrors.confirmPassword ?? state.fieldErrors?.confirmPassword,
  };

  return (
    <AuthShell
      title="Create your account"
      description="Create your login, verify your email, then complete your member profile before starting the application."
      footerText="Already have an account?"
      footerLinkHref="/auth/login"
      footerLinkLabel="Sign in"
      organizationName={organizationName}
    >
      <form
        className="space-y-5"
        action={action}
        onSubmit={(event) => {
          const formData = new FormData(event.currentTarget);
          const validationErrors = validateRegisterFormSubmit(formData);
          if (validationErrors) {
            event.preventDefault();
            setLocalErrors(validationErrors);
            return;
          }

          setLocalErrors({});
        }}
      >
        <Field>
          <FieldLabel htmlFor="email" required>
            Email address
          </FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.values?.email ?? ""}
            className={fieldErrors.email ? registerInputErrorClass : undefined}
            onChange={() => {
              if (localErrors.email) {
                setLocalErrors((current) => ({ ...current, email: undefined }));
              }
            }}
            required
          />
          <FieldError>{fieldErrors.email}</FieldError>
        </Field>

        <AuthCreatePasswordFields
          passwordError={fieldErrors.password}
          confirmPasswordError={fieldErrors.confirmPassword}
          inputErrorClass={registerInputErrorClass}
          onPasswordChange={() => {
            if (localErrors.password || localErrors.confirmPassword) {
              setLocalErrors((current) => ({
                ...current,
                password: undefined,
                confirmPassword: undefined,
              }));
            }
          }}
          onConfirmPasswordChange={() => {
            if (localErrors.confirmPassword) {
              setLocalErrors((current) => ({
                ...current,
                confirmPassword: undefined,
              }));
            }
          }}
        />

        <AuthFormStatus error={state.error} success={state.success} />

        <AuthSubmitButton icon={<UserPlus />}>Create account</AuthSubmitButton>
      </form>

      <AuthDivider />
      <GoogleLoginButton />
    </AuthShell>
  );
}
