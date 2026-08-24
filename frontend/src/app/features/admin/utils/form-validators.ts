import { ValidationErrors, ValidatorFn } from '@angular/forms';

export const optionalAbsoluteUrl: ValidatorFn = (control): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (!value) {
    return null;
  }

  try {
    new URL(value);
    return null;
  } catch {
    return { absoluteUrl: true };
  }
};
