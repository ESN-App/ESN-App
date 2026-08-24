import { ValidationErrors, ValidatorFn } from '@angular/forms';

// Mirrors the backend's ASP.NET Identity password policy (min length 8, requires a digit and an
// uppercase letter) so the requirement is validated and explained in one place, not discovered
// only after a round trip to the server.
export const passwordComplexity: ValidatorFn = (control): ValidationErrors | null => {
  const value = (control.value as string | null) ?? '';
  if (!value) {
    return null;
  }

  const errors: ValidationErrors = {};
  if (!/[0-9]/.test(value)) {
    errors['missingDigit'] = true;
  }
  if (!/[A-Z]/.test(value)) {
    errors['missingUppercase'] = true;
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

export const PASSWORD_REQUIREMENTS_HINT = 'At least 8 characters, including 1 uppercase letter and 1 number.';

// Group-level validator: expects sibling controls named "password" and "confirmPassword".
export const passwordsMatch: ValidatorFn = (control): ValidationErrors | null => {
  const password = control.get('password')?.value as string | null;
  const confirmPassword = control.get('confirmPassword')?.value as string | null;

  if (password && confirmPassword && password !== confirmPassword) {
    return { passwordMismatch: true };
  }
  return null;
};
