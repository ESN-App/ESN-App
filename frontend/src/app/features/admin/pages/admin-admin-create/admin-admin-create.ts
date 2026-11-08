import { Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PASSWORD_REQUIREMENTS_HINT } from '../../../../shared';
import { AdminSaveLabel, SAVED_REDIRECT_DELAY_MS } from '../../components/admin-save-label/admin-save-label';
import { AdminToast } from '../../utils/admin-toast';
import { AdminApi } from '../../data-access/admin-api';
import { adminNameError, applyServerErrors, createAdminForm } from '../../utils/admin-form';

@Component({
  selector: 'app-admin-admin-create',
  imports: [AdminSaveLabel, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-admin-create.html',
  styleUrl: './admin-admin-create.scss',
})
export class AdminAdminCreate {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);
  private readonly toast = inject(AdminToast);
  private readonly destroyRef = inject(DestroyRef);

  readonly passwordHint = PASSWORD_REQUIREMENTS_HINT;
  readonly submitting = signal(false);
  readonly saved = signal(false);
  readonly confirmationOpen = signal(false);
  readonly error = signal<string | null>(null);
  readonly passwordVisible = signal(false);
  readonly confirmPasswordVisible = signal(false);

  readonly form = createAdminForm(this.formBuilder);

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.invalid && (control.dirty || control.touched));
  }

  nameError(controlName: 'firstName' | 'lastName', requiredMessage: string): string {
    return adminNameError(this.form.controls[controlName], requiredMessage);
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update((visible) => !visible);
  }

  showMismatchError(): boolean {
    const confirmPassword = this.form.controls.confirmPassword;
    return Boolean(
      this.form.hasError('passwordMismatch') && (confirmPassword.dirty || confirmPassword.touched),
    );
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.confirmationOpen.set(true);
  }

  cancelConfirmation(): void {
    this.confirmationOpen.set(false);
  }

  confirmSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.confirmationOpen.set(false);
      return;
    }

    this.confirmationOpen.set(false);

    const value = this.form.getRawValue();

    this.submitting.set(true);
    this.error.set(null);

    this.api
      .createAdmin({
        email: value.email!.trim(),
        password: value.password!,
        firstName: value.firstName!.trim(),
        lastName: value.lastName!.trim(),
      })
      .subscribe({
        next: () => {
          // Show "Saved" briefly; the toast is root-level, so it stays up after the redirect.
          this.saved.set(true);
          this.toast.show('Admin created');
          // Cancelled if the admin leaves the form before the redirect.
          timer(SAVED_REDIRECT_DELAY_MS)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => void this.router.navigate(['/admin'], { queryParams: { section: 'admins' } }));
        },
        error: (response) => {
          this.submitting.set(false);
          const unmatched = applyServerErrors(this.form, response?.error?.errors);
          const fieldErrorsShown = unmatched.length === 0 && Boolean(response?.error?.errors);
          this.error.set(
            fieldErrorsShown
              ? null
              : (unmatched[0] ?? response?.error?.error ?? 'The admin account could not be created.'),
          );
        },
      });
  }

  @HostListener('document:keydown.escape')
  closeConfirmationOnEscape(): void {
    if (this.confirmationOpen() && !this.submitting()) {
      this.cancelConfirmation();
    }
  }
}
