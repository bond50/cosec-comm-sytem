import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthCreatePasswordFields } from "@/features/auth/components/auth-create-password-fields";
import { AuthFeedback } from "@/features/auth/components/auth-feedback";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";

type AuthAccessRegisterStepProps = {
  registrationComplete: boolean;
  emailValue: string;
  successMessage?: string;
  passwordError?: string;
  confirmPasswordError?: string;
  inputErrorClass: string;
  onPasswordChange: () => void;
  onConfirmPasswordChange: () => void;
  onUseAnotherEmail: () => void;
};

export function AuthAccessRegisterStep({
  registrationComplete,
  emailValue,
  successMessage,
  passwordError,
  confirmPasswordError,
  inputErrorClass,
  onPasswordChange,
  onConfirmPasswordChange,
  onUseAnotherEmail,
}: AuthAccessRegisterStepProps) {
  if (registrationComplete) {
    return (
      <div className="space-y-3">
        <AuthFeedback
          type="info"
          title="Check your email"
          message={successMessage}
          icon="mail"
          compact
          className="border-sky-200/80 bg-[linear-gradient(180deg,rgba(232,242,251,0.9),rgba(226,238,249,0.94))] shadow-[0_8px_24px_rgba(148,163,184,0.12)]"
        />

        <div className="grid gap-2.5 sm:grid-cols-2">
          <Link
            href={`/auth/verify-email?email=${encodeURIComponent(emailValue)}`}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-[0.95rem] font-medium text-[#1f5f99] shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            Resend link
          </Link>

          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-slate-200 text-[0.95rem] font-medium text-slate-700"
            onClick={onUseAnotherEmail}
          >
            Use another email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[0.82rem] leading-5 text-slate-500">
        Create a password to register this email.
      </p>

      <AuthCreatePasswordFields
        passwordError={passwordError}
        confirmPasswordError={confirmPasswordError}
        inputErrorClass={inputErrorClass}
        onPasswordChange={onPasswordChange}
        onConfirmPasswordChange={onConfirmPasswordChange}
        fieldClassName="space-y-1.5"
        descriptionClassName="text-[0.9rem] leading-5"
      />

      <AuthSubmitButton>Create account</AuthSubmitButton>
    </div>
  );
}
