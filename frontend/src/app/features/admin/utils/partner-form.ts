import { FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { DiscountDto } from '../data-access/admin-api';
import { optionalAbsoluteUrl } from './form-validators';

const coordinatesTogether: ValidatorFn = (control): ValidationErrors | null => {
  const latitude = control.get('latitude')?.value as number | null;
  const longitude = control.get('longitude')?.value as number | null;

  if ((latitude === null) !== (longitude === null)) {
    return { coordinatesIncomplete: true };
  }
  return null;
};

export function createDiscountGroup(formBuilder: FormBuilder, existing?: DiscountDto) {
  return formBuilder.group({
    id: [existing?.id ?? (null as string | null)],
    title: [existing?.title ?? '', [Validators.required, Validators.maxLength(200)]],
    description: [existing?.description ?? '', [Validators.maxLength(2000)]],
  });
}

export type DiscountGroup = ReturnType<typeof createDiscountGroup>;

export function createPartnerForm(formBuilder: FormBuilder) {
  return formBuilder.group(
    {
      status: [0, [Validators.required, Validators.min(0), Validators.max(2)]],
      name: ['', [Validators.required, Validators.maxLength(200)]],
      shortDescription: ['', [Validators.required, Validators.maxLength(500)]],
      description: ['', [Validators.required, Validators.maxLength(5000)]],
      address: ['', [Validators.maxLength(500)]],
      websiteUrl: ['', [Validators.maxLength(2000), optionalAbsoluteUrl]],
      googleMapsUrl: ['', [Validators.maxLength(2000), optionalAbsoluteUrl]],
      latitude: [null as number | null, [Validators.min(-90), Validators.max(90)]],
      longitude: [null as number | null, [Validators.min(-180), Validators.max(180)]],
      discounts: formBuilder.array([] as DiscountGroup[]),
    },
    { validators: coordinatesTogether },
  );
}

export type PartnerForm = ReturnType<typeof createPartnerForm>;
