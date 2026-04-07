"use client";

import { ShieldCheck } from "lucide-react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type AuthOtpFieldProps = {
  id?: string;
  name?: string;
  label?: string;
  description?: string;
  error?: string;
  defaultValue?: string;
  required?: boolean;
};

export function AuthOtpField({
  id = "code",
  name = "code",
  label = "Verification code",
  description = "Enter the six-digit code sent to your email to continue.",
  error,
  defaultValue,
  required = false,
}: AuthOtpFieldProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-soft)] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
        <ShieldCheck className="h-4 w-4" />
        Two-factor verification
      </div>
      <p className="text-sm leading-6 text-slate-700">{description}</p>
      <Field>
        <FieldLabel htmlFor={id} required={required}>
          {label}
        </FieldLabel>
        <InputOTP
          id={id}
          name={name}
          maxLength={6}
          inputMode="numeric"
          autoComplete="one-time-code"
          defaultValue={defaultValue}
          pattern="^[0-9]+$"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <FieldError>{error}</FieldError>
      </Field>
    </div>
  );
}
