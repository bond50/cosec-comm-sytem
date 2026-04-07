import { Badge } from "@/components/ui/badge";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type AuthAccessEmailStepProps = {
  emailValue: string;
  emailError?: string;
  inputErrorClass: string;
  onEmailChange: () => void;
  showLastUsedBadge?: boolean;
};

export function AuthAccessEmailStep({
  emailValue,
  emailError,
  inputErrorClass,
  onEmailChange,
  showLastUsedBadge = false,
}: AuthAccessEmailStepProps) {
  return (
    <Field>
      <FieldLabel htmlFor="email" required>
        Email address
      </FieldLabel>
      <div className="relative">
        {showLastUsedBadge ? (
          <Badge
            variant="outline"
            className="pointer-events-none absolute right-3 top-[-0.65rem] z-10 rounded-full border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 shadow-sm"
          >
            Last used
          </Badge>
        ) : null}

        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={emailValue}
          className={emailError ? inputErrorClass : undefined}
          onChange={onEmailChange}
          required
        />
      </div>
      <FieldError>{emailError}</FieldError>
    </Field>
  );
}
