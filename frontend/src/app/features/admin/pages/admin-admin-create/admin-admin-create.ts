import { Component, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PASSWORD_REQUIREMENTS_HINT } from '../../../../shared';
import { AdminApi } from '../../data-access/admin-api';
import { createAdminForm } from '../../utils/admin-form';

@Component({
  selector: 'app-admin-admin-create',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-admin-create.html',
  styleUrl: './admin-admin-create.scss',
})
export class AdminAdminCreate {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);

  readonly passwordHint = PASSWORD_REQUIREMENTS_HINT;
  readonly submitting = signal(false);
  readonly confirmationOpen = signal(false);
  readonly error = signal<string | null>(null);
  readonly passwordVisible = signal(false);
  readonly confirmPasswordVisible = signal(false);

  readonly form = createAdminForm(this.formBuilder);

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.invalid && (control.dirty || control.touched));
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

    this.api.createAdmin(value.email!.trim(), value.password!).subscribe({
      next: () => void this.router.navigate(['/admin'], { queryParams: { section: 'admins' } }),
      error: (response) => {
        this.submitting.set(false);
        this.error.set(
          response?.error?.error ?? 'The admin account could not be created.',
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
