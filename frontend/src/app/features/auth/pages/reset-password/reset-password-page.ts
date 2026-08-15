import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core';
import { PASSWORD_REQUIREMENTS_HINT, passwordComplexity, passwordsMatch } from '../../../../shared';

@Component({
  selector: 'app-reset-password-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password-page.html',
  styleUrl: './reset-password-page.scss',
})
export class ResetPasswordPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly passwordHint = PASSWORD_REQUIREMENTS_HINT;
  readonly email = this.route.snapshot.queryParamMap.get('email');
  private readonly token = this.route.snapshot.queryParamMap.get('token');
  readonly linkValid = Boolean(this.email && this.token);

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly error = signal<string | null>(null);
  readonly passwordVisible = signal(false);
  readonly confirmPasswordVisible = signal(false);

  readonly form = this.formBuilder.group(
    {
      password: ['', [Validators.required, Validators.minLength(8), passwordComplexity]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update((visible) => !visible);
  }

  showError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.invalid && (control.dirty || control.touched));
  }

  showMismatchError(): boolean {
    const confirmPassword = this.form.controls.confirmPassword;
    return Boolean(
      this.form.hasError('passwordMismatch') && (confirmPassword.dirty || confirmPassword.touched),
    );
  }

  submit(): void {
    if (this.form.invalid || this.submitting() || !this.email || !this.token) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const { password } = this.form.getRawValue();

    this.authService.resetPassword(this.email, this.token, password).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
      },
      error: (response) => {
        this.submitting.set(false);
        this.error.set(response?.error?.error ?? 'The password could not be reset. Please try again.');
      },
    });
  }
}
