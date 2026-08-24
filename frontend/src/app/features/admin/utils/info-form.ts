import { FormBuilder, Validators } from '@angular/forms';
import { optionalAbsoluteUrl } from './form-validators';

export function createExternalLinkControl(formBuilder: FormBuilder, value = '') {
  return formBuilder.control(value, [
    Validators.required,
    Validators.maxLength(2000),
    optionalAbsoluteUrl,
  ]);
}

export type ExternalLinkControl = ReturnType<typeof createExternalLinkControl>;

export function createInfoForm(formBuilder: FormBuilder) {
  return formBuilder.group({
    status: [0, [Validators.required, Validators.min(0), Validators.max(1)]],
    title: ['', [Validators.required, Validators.maxLength(200)]],
    slug: [
      '',
      [
        Validators.required,
        Validators.maxLength(200),
        Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      ],
    ],
    category: ['', [Validators.required, Validators.maxLength(100)]],
    content: ['', [Validators.required, Validators.maxLength(50_000)]],
    externalLinks: formBuilder.array<ExternalLinkControl>([]),
  });
}

export type InfoForm = ReturnType<typeof createInfoForm>;
