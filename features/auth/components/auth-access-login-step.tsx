import Link from "next/link";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthFeedback } from "@/features/auth/components/auth-feedback";
import { AuthOtpField } from "@/features/auth/components/auth-otp-field";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";

type AuthAccessLoginStepProps = {
  passwordError?: string;
  codeError?: string;
  codeDefaultValue: string;
  inputErrorClass: string;
  twoFactorRequired: boolean;
  onPasswordChange: () => void;
};

export function AuthAccessLoginStep({
  passwordError,
  codeError,
  codeDefaultValue,
  inputErrorClass,
  twoFactorRequired,
  onPasswordChange,
}: AuthAccessLoginStepProps) {
  return (
    <>
      <AuthFeedback
        title="Account found"
        message="Enter your password to continue. If you normally use Google, you can also continue with Google below."
      />

      <Field>
        <div className="flex items-center justify-between">
          <FieldLabel htmlFor="password" required>
            Password
          </FieldLabel>
          <Link
            href="/auth/reset"
            className="text-sm font-semibold text-[var(--brand)] hover:opacity-85"
          >
            Forgot password?
          </Link>
        </div>

        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className={passwordError ? inputErrorClass : undefined}
          onChange={onPasswordChange}
          required
        />
        <FieldError>{passwordError}</FieldError>
      </Field>

      {twoFactorRequired ? (
        <AuthOtpField error={codeError} defaultValue={codeDefaultValue} />
      ) : null}

      <AuthSubmitButton>Sign in</AuthSubmitButton>
    </>
  );
}
