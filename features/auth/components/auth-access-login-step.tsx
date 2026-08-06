import Link from "next/link";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthOtpField } from "@/features/auth/components/auth-otp-field";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import { cn } from "@/lib/utils";

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
      <p className="text-[0.85rem] leading-5 text-slate-500">
        Enter your password. If you use Google, continue below.
      </p>

      <Field className="space-y-4">
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
          className={cn("mt-2", passwordError && inputErrorClass)}
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
