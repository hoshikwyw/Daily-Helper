"use client";

import { PasswordInput } from "@/components/ui/password-input";

type NewPasswordFieldsProps = {
  password: string;
  confirm: string;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  required?: boolean;
};

/**
 * The pair of fields for choosing a password, used wherever one is set: the
 * reset-link page and the Account card. Validate with `newPasswordProblem`.
 */
export function NewPasswordFields({
  password,
  confirm,
  onPasswordChange,
  onConfirmChange,
  required,
}: NewPasswordFieldsProps) {
  return (
    <>
      <PasswordInput
        label="New password"
        autoComplete="new-password"
        placeholder="At least 8 characters, letters and numbers"
        required={required}
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
      />
      <PasswordInput
        label="Confirm new password"
        autoComplete="new-password"
        placeholder="Type it again"
        required={required}
        value={confirm}
        onChange={(e) => onConfirmChange(e.target.value)}
      />
    </>
  );
}
