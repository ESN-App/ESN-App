import { FormBuilder, Validators } from '@angular/forms';
import { passwordComplexity, passwordsMatch } from '../../../shared';

export function createAdminForm(formBuilder: FormBuilder) {
  return formBuilder.group(
    {
      email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
      password: ['', [Validators.required, Validators.minLength(8), passwordComplexity]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );
}

export type AdminForm = ReturnType<typeof createAdminForm>;
