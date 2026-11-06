import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { passwordComplexity, passwordsMatch } from '../../../shared';

/** Matches the backend validator for admin first and last names. */
export const ADMIN_NAME_MAX_LENGTH = 50;

const nameValidators = [
  Validators.required,
  Validators.pattern(/\S/),
  Validators.maxLength(ADMIN_NAME_MAX_LENGTH),
];

export function createAdminForm(formBuilder: FormBuilder) {
  return formBuilder.group(
    {
      firstName: ['', nameValidators],
      lastName: ['', nameValidators],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
      password: ['', [Validators.required, Validators.minLength(8), passwordComplexity]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );
}

export type AdminForm = ReturnType<typeof createAdminForm>;

/** Message for an invalid name control: server error first, then required/blank, then length. */
export function adminNameError(control: AbstractControl, requiredMessage: string): string {
  const server = control.getError('server') as string | null;
  if (server) {
    return server;
  }

  return control.hasError('maxlength')
    ? `Use ${ADMIN_NAME_MAX_LENGTH} characters or fewer.`
    : requiredMessage;
}

/**
 * Puts 400 ProblemDetails field errors (e.g. `errors.FirstName`) on the matching
 * camelCase controls. Returns the messages that have no matching control.
 */
export function applyServerErrors(
  form: FormGroup,
  errors: Record<string, string[] | string> | null | undefined,
): string[] {
  const unmatched: string[] = [];
  for (const [key, value] of Object.entries(errors ?? {})) {
    const messages = Array.isArray(value) ? value : [value];
    const control = form.get(key.charAt(0).toLowerCase() + key.slice(1));
    if (control && messages.length > 0) {
      control.setErrors({ ...control.errors, server: messages[0] });
      control.markAsTouched();
    } else {
      unmatched.push(...messages);
    }
  }
  return unmatched;
}
