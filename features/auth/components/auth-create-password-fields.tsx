import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AuthCreatePasswordFieldsProps = {
  passwordError?: string;
  confirmPasswordError?: string;
  inputErrorClass?: string;
  onPasswordChange: () => void;
  onConfirmPasswordChange: () => void;
  description?: string;
  fieldClassName?: string;
  descriptionClassName?: string;
};

export function AuthCreatePasswordFields({
  passwordError,
  confirmPasswordError,
  inputErrorClass,
  onPasswordChange,
  onConfirmPasswordChange,
  fieldClassName,
}: AuthCreatePasswordFieldsProps) {
  return (
    <>
      <Field className={fieldClassName}>
        <FieldLabel htmlFor="password" required>
          Password
        </FieldLabel>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className={cn("mt-2", passwordError && inputErrorClass)}
          onChange={onPasswordChange}
          required
        />
        <FieldError>{passwordError}</FieldError>
      </Field>

      <Field className={fieldClassName}>
        <FieldLabel htmlFor="confirmPassword" required>
          Confirm password
        </FieldLabel>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={cn("mt-2", confirmPasswordError && inputErrorClass)}
          onChange={onConfirmPasswordChange}
          required
        />
        <FieldError>{confirmPasswordError}</FieldError>
      </Field>
    </>
  );
}
