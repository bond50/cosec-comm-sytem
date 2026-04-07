import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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
  description = "Use at least 8 characters with upper, lower, number, and symbol.",
  fieldClassName,
  descriptionClassName,
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
          className={passwordError ? inputErrorClass : undefined}
          onChange={onPasswordChange}
          required
        />
        <FieldDescription className={descriptionClassName}>
          {description}
        </FieldDescription>
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
          className={confirmPasswordError ? inputErrorClass : undefined}
          onChange={onConfirmPasswordChange}
          required
        />
        <FieldError>{confirmPasswordError}</FieldError>
      </Field>
    </>
  );
}
