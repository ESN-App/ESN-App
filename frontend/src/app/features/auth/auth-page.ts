import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core';

@Component({
  selector: 'app-auth-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss',
})
export class AuthPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly passwordVisible = signal(false);

  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();

    this.submitting.set(true);
    this.error.set(null);

    this.authService.login(email, password).subscribe({
      next: () => {
        if (!this.authService.isAdmin()) {
          this.authService.logout();
          this.submitting.set(false);
          this.error.set('This sign-in is reserved for ESN administrators.');
          return;
        }

        const requestedUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const destination = requestedUrl?.startsWith('/') ? requestedUrl : '/admin';
        this.router.navigateByUrl(destination);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.error ?? 'We could not log you in. Check your details and try again.');
      },
    });
  }
}
