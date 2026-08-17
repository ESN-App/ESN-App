import { FormBuilder, Validators } from '@angular/forms';

export function createNewsForm(formBuilder: FormBuilder) {
  return formBuilder.group({
    status: [0, [Validators.required, Validators.min(0), Validators.max(1)]],
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
  });
}

export type NewsForm = ReturnType<typeof createNewsForm>;
