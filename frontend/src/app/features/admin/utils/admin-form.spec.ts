import { FormBuilder } from '@angular/forms';
import { adminNameError, applyServerErrors, createAdminForm } from './admin-form';

describe('admin form', () => {
  const create = () => createAdminForm(new FormBuilder());

  it('requires non-blank first and last names up to 50 characters', () => {
    const form = create();
    form.controls.firstName.setValue('   ');
    expect(adminNameError(form.controls.firstName, 'Enter a first name.')).toBe('Enter a first name.');
    expect(form.controls.firstName.invalid).toBe(true);

    form.controls.lastName.setValue('x'.repeat(51));
    expect(adminNameError(form.controls.lastName, 'Enter a last name.')).toBe('Use 50 characters or fewer.');

    form.controls.lastName.setValue('Kowalski');
    expect(form.controls.lastName.valid).toBe(true);
  });

  it('maps ProblemDetails field errors to controls and returns the rest', () => {
    const form = create();
    const unmatched = applyServerErrors(form, {
      FirstName: ['First name is too long.'],
      Email: 'Email is taken.',
      Other: ['Something else.'],
    });

    expect(adminNameError(form.controls.firstName, 'Enter a first name.')).toBe('First name is too long.');
    expect(form.controls.firstName.touched).toBe(true);
    expect(form.controls.email.getError('server')).toBe('Email is taken.');
    expect(unmatched).toEqual(['Something else.']);
    expect(applyServerErrors(form, undefined)).toEqual([]);
  });
});
