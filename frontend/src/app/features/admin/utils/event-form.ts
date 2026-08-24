import { FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { optionalAbsoluteUrl } from './form-validators';

const eventRelationships: ValidatorFn = (control): ValidationErrors | null => {
  const startsAt = control.get('startsAt')?.value as Date | null;
  const endsAt = control.get('endsAt')?.value as Date | null;
  const minimum = control.get('minimumParticipants')?.value as number | null;
  const maximum = control.get('maximumParticipants')?.value as number | null;

  if (startsAt && endsAt && endsAt.getTime() <= startsAt.getTime()) {
    return { endBeforeStart: true };
  }
  if (minimum !== null && maximum !== null && maximum < minimum) {
    return { maximumBelowMinimum: true };
  }
  return null;
};

export function createEventForm(formBuilder: FormBuilder) {
  return formBuilder.group(
    {
      status: [0, [Validators.required, Validators.min(0), Validators.max(2)]],
      title: ['', [Validators.required, Validators.maxLength(200)]],
      shortDescription: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.maxLength(5000)]],
      location: ['', [Validators.required, Validators.maxLength(500)]],
      startsAt: [null as Date | null, Validators.required],
      endsAt: [null as Date | null],
      price: [0, [Validators.required, Validators.min(0)]],
      registrationUrl: ['', [Validators.maxLength(2000), optionalAbsoluteUrl]],
      googleMapsUrl: ['', [Validators.maxLength(2000), optionalAbsoluteUrl]],
      minimumParticipants: [null as number | null, Validators.min(0)],
      maximumParticipants: [null as number | null, Validators.min(0)],
    },
    { validators: eventRelationships },
  );
}

export type EventForm = ReturnType<typeof createEventForm>;
